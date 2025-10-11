import { UltraOptimizedUserManagementDAO } from "../../daos/Teacher/ultra-optimized-user-management.dao";
import { Users } from "../../entity/users.entity";
import { ErrorHandledService } from "../error.handdled.service";
import bcrypt from "bcryptjs";
import redis from "../../config/redis";
import { 
  FileProcessingUtils, 
  MulterFile, 
  StudentExcelData, 
  BulkEnrollmentData 
} from "../../utils/fileProcessingUtils";
import { RiskCalculator, RiskCalculationInput } from "../../utils/riskCalculator";

interface ProcessedStudent {
  first_name_tha: string;
  last_name_tha: string;
  first_name_eng: string;
  last_name_eng: string;
  users_id: number;
  department_id: number;
  soft_hours: number;
  hard_hours: number;
  status: 'Active' | 'InActive';
  faculty_id: number;
  email: string;
  risk_status: 'Normal' | 'Risk';
  risk_percentage: number;
  education_status: 'Studying' | 'Graduate';
  grade_id: number;
}

interface ReferenceData {
  gradeMap: Map<string, number>;
  departmentMap: Map<string, number>;
  eventCoopMap: Map<string, any>;
}

export class UltraOptimizedUserManagementService extends ErrorHandledService {
  private readonly userManagementDAO = new UltraOptimizedUserManagementDAO();
  
  // ✅ Preload ข้อมูลทั้งหมดใน 3 queries เท่านั้น
  private async preloadAllReferenceData(): Promise<ReferenceData> {
    // Use optimized DAO methods for better performance
    const [gradeMap, departmentMap, eventCoopMap] = await Promise.all([
      this.userManagementDAO.ultraGetGradeMapping(),
      this.userManagementDAO.ultraGetDepartmentMapping(),
      this.userManagementDAO.ultraGetEventCoopMapping()
    ]);
    
    console.log(`✅ Preloaded: ${gradeMap.size} grades, ${departmentMap.size} departments, ${eventCoopMap.size} event coops`);
    
    return { gradeMap, departmentMap, eventCoopMap };
  }

  // ✅ Batch create users using optimized DAO
  private async ultraBatchCreateUsers(studentDataList: StudentExcelData[]): Promise<Map<string, Users>> {
    try {
      const usernames = studentDataList.map(data => data.code);
      console.log(`🔄 Batch creating users for ${usernames.length} students...`);
      console.log(`📝 Sample usernames: ${usernames.slice(0, 5).join(', ')}${usernames.length > 5 ? '...' : ''}`);
      
      // Hash passwords in parallel with progress logging
      console.log(`🔐 Starting to hash passwords for ${usernames.length} users...`);
      console.log(`📝 Sample usernames to hash: ${usernames.slice(0, 5).join(', ')}${usernames.length > 5 ? '...' : ''}`);
      
      const hashStartTime = Date.now();
      const hashedPasswords = await Promise.all(
        studentDataList.map(async (data, index) => {
          const hashedPassword = await bcrypt.hash(`std_${data.code}`, 10);
          
          // Log progress every 100 passwords or at the end
          if (index % 100 === 0 || index === studentDataList.length - 1) {
            console.log(`🔐 Hashed password ${index + 1}/${studentDataList.length}: ${data.code}`);
          }
          
          return {
            username: data.code,
            password: hashedPassword,
            roles_id: 3
          };
        })
      );
      
      const hashEndTime = Date.now();
      const hashDuration = (hashEndTime - hashStartTime) / 1000;
      console.log(`✅ Successfully hashed passwords for ${hashedPasswords.length} users in ${hashDuration.toFixed(2)} seconds`);
      
      // Use optimized DAO for batch user creation
      console.log(`💾 Inserting users into database...`);
      const users = await this.userManagementDAO.ultraBatchCreateUsers(hashedPasswords);
      
      // Convert to Map for easy lookup
      const userMap = new Map<string, Users>();
      users.forEach(user => {
        userMap.set(user.username, user);
      });
      
      console.log(`✅ Successfully created/retrieved ${users.length} users`);
      return userMap;
      
    } catch (error) {
      console.error("❌ Error in ultraBatchCreateUsers:", error);
      throw error;
    }
  }

  // ✅ Process students in memory only (NO database queries)
  private async processStudentsInMemory(
    studentDataList: StudentExcelData[],
    userMap: Map<string, Users>,
    referenceData: ReferenceData
  ): Promise<ProcessedStudent[]> {
    const { gradeMap, departmentMap, eventCoopMap } = referenceData;
    const processedStudents: ProcessedStudent[] = [];
    
    console.log('\n' + '='.repeat(80));
    console.log(`🔄 [PROCESS STUDENTS] Processing ${studentDataList.length} students in memory...`);
    console.log(`📋 [PROCESS STUDENTS] Available gradeMap keys: [${Array.from(gradeMap.keys()).map(k => `"${k}"`).join(', ')}]`);
    console.log(`📋 [PROCESS STUDENTS] Available gradeMap:`, Object.fromEntries(gradeMap));
    console.log('='.repeat(80) + '\n');
    
    // Track grade distribution for debugging
    const gradeDistribution = new Map<number, number>();
    const prefixToGradeExamples = new Map<string, string[]>();
    
    for (let i = 0; i < studentDataList.length; i++) {
      const data = studentDataList[i];
      try {
        const user = userMap.get(data.code);
        if (!user) {
          console.log(`⚠️ User not found for username: ${data.code}`);
          continue;
        }
        
        // Log progress every 100 students
        if (i % 100 === 0 || i === studentDataList.length - 1) {
          console.log(`📝 Processing student ${i + 1}/${studentDataList.length}: ${data.code}`);
        }
        
        // Split names (in memory)
        const thaiName = FileProcessingUtils.splitName(data.name);
        const engName = FileProcessingUtils.splitName(data.engName);
        
        // Get grade_id from cache (O(1)) - WITH DETAILED LOGGING
        const originalUsername = user.username;
        const usernamePrefix = user.username.substring(0, 2).trim();
        const gradeId = gradeMap.get(usernamePrefix) || 1;
        const foundInMap = gradeMap.has(usernamePrefix);
        
        // Track grade distribution
        gradeDistribution.set(gradeId, (gradeDistribution.get(gradeId) || 0) + 1);
        
        // Track examples for each prefix
        if (!prefixToGradeExamples.has(usernamePrefix)) {
          prefixToGradeExamples.set(usernamePrefix, []);
        }
        const examples = prefixToGradeExamples.get(usernamePrefix)!;
        if (examples.length < 3) {
          examples.push(`${originalUsername} -> grade_id: ${gradeId}`);
        }
        
        // Debug logging - แสดงละเอียดสำหรับ 10 คนแรก
        if (i < 10) {
          console.log('\n' + '-'.repeat(80));
          console.log(`🔍 [GRADE ASSIGN DETAIL] Student #${i + 1}:`);
          console.log(`   📝 Username (original): "${originalUsername}"`);
          console.log(`   📝 Username length: ${originalUsername.length}`);
          console.log(`   📝 Username char codes: [${originalUsername.split('').slice(0, 4).map(c => `'${c}'(${c.charCodeAt(0)})`).join(', ')}]`);
          console.log(`   ✂️  Extracted prefix (first 2 chars): "${usernamePrefix}"`);
          console.log(`   📏 Prefix length: ${usernamePrefix.length}`);
          console.log(`   🔍 Looking up in gradeMap...`);
          console.log(`   🗺️  gradeMap.has("${usernamePrefix}"): ${foundInMap}`);
          console.log(`   🎯 Result: gradeId = ${gradeId} ${foundInMap ? '✅ (from map)' : '⚠️ (fallback to 1)'}`);
          console.log('-'.repeat(80));
        }
        
        // Debug logging - แสดงเฉพาะเมื่อไม่เจอใน map (จริง ๆ)
        if (!foundInMap) {
          console.warn(`\n⚠️ [GRADE FALLBACK] Student #${i + 1}:`);
          console.warn(`   Username: "${originalUsername}"`);
          console.warn(`   Prefix: "${usernamePrefix}" (length: ${usernamePrefix.length})`);
          console.warn(`   Found in map: ${foundInMap}`);
          console.warn(`   GradeId: ${gradeId} (used fallback value 1)`);
          console.warn(`   Available keys in gradeMap: [${Array.from(gradeMap.keys()).map(k => `"${k}"`).join(', ')}]`);
        }
        
        // Debug logging - แสดง 5 คนแรกและทุก 100 คน
        if (i < 5 || i % 100 === 0) {
          console.log(`🔍 [GRADE DEBUG] Student ${i+1}: Username: "${originalUsername}", Prefix: "${usernamePrefix}", GradeId: ${gradeId}, Found in map: ${foundInMap}`);
        }
        
        // Get department_id from cache (O(1))
        const departmentId = departmentMap.get(data.major) || 1;
        
        // Calculate hours
        let softHours = 0;
        let hardHours = 0;
        const isGrade1Or2 = gradeId === 1 || gradeId === 2;
        
        if (!isGrade1Or2) {
          softHours = data.softSkill ?? 0;
          hardHours = data.hardSkill ?? 0;
        }
        
        // Calculate risk from cache (O(1))
        const eventCoopKey = `${gradeId}_${departmentId}`;
        const eventCoop = eventCoopMap.get(eventCoopKey);
        
        let riskStatus: 'Normal' | 'Risk' = 'Normal';
        let riskPercentage = 0;
        
        if (eventCoop && eventCoop.is_on_coop) {
          const riskInput: RiskCalculationInput = {
            hardCurrent: hardHours,
            softCurrent: softHours,
            daysLeft: eventCoop.remaining_days || 0,
            isOnCoop: eventCoop.is_on_coop
          };
          
          const riskResult = RiskCalculator.calculateRisk(riskInput);
          riskStatus = riskResult.riskStatus;
          riskPercentage = riskResult.riskPercent;
        }
        
        // Create student object
        const student: ProcessedStudent = {
          first_name_tha: thaiName.firstName,
          last_name_tha: thaiName.lastName,
          first_name_eng: engName.firstName,
          last_name_eng: engName.lastName,
          users_id: user.users_id,
          department_id: departmentId,
          soft_hours: softHours,
          hard_hours: hardHours,
          status: "Active",
          faculty_id: 1,
          email: `${user.username}@go.buu.ac.th`,
          risk_status: riskStatus,
          risk_percentage: Math.round(riskPercentage),
          education_status: "Studying",
          grade_id: gradeId,
        };
        
        processedStudents.push(student);
        
      } catch (conversionError) {
        console.error(`❌ Error converting row for ${data.name} (${data.code}):`, conversionError);
      }
    }
    
    // Print summary statistics
    console.log('\n' + '='.repeat(80));
    console.log('📊 [GRADE ASSIGNMENT SUMMARY]');
    console.log('='.repeat(80));
    console.log(`✅ Successfully processed ${processedStudents.length}/${studentDataList.length} students`);
    console.log('\n📈 Grade Distribution:');
    gradeDistribution.forEach((count, gradeId) => {
      const percentage = ((count / processedStudents.length) * 100).toFixed(2);
      console.log(`   Grade ${gradeId}: ${count} students (${percentage}%)`);
    });
    
    console.log('\n📋 Prefix to Grade Examples (first 3 of each):');
    prefixToGradeExamples.forEach((examples, prefix) => {
      const gradeId = gradeMap.get(prefix) || 1;
      console.log(`   Prefix "${prefix}" -> grade_id ${gradeId}:`);
      examples.forEach(example => {
        console.log(`      - ${example}`);
      });
    });
    console.log('='.repeat(80) + '\n');
    
    return processedStudents;
  }

  // ✅ Ultra optimized insert using DAO
  private async ultraInsertStudents(students: ProcessedStudent[]): Promise<void> {
    await this.userManagementDAO.ultraBatchInsertStudents(students);
  }

  // ✅ Main ultra-optimized upload method
  public async ultraOptimizedUploadStudents(file: MulterFile): Promise<{ 
    message: string; 
    count: number; 
    totalRecords?: number;
    newRecords?: number;
    duplicateRecords?: number;
    errors?: string[] 
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      console.log(`📁 Processing file: ${file.originalname}`);
      
      // 1. Validate file size
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit");
      }

      // 2. Read Excel data
      const data = FileProcessingUtils.readExcelFile<StudentExcelData>(file.path);
      console.log(`📊 Found ${data.length} rows in Excel file`);

      if (data.length === 0) {
        throw new Error("No data found in Excel file");
      }

      // 3. Preload ALL reference data in 3 queries
      console.log("🔄 Preloading reference data...");
      const referenceData = await this.preloadAllReferenceData();

      // 4. Filter new students
      console.log("🔄 Filtering new students...");
      const existingUsernames = await this.userManagementDAO.getAllUsernames();
      const existingUsernameSet = new Set(existingUsernames.map(u => u.username));
      
      const newStudentsData = data.filter(user => 
        !existingUsernameSet.has(String(user.code))
      );
      
      const duplicateStudents = data.filter(user => 
        existingUsernameSet.has(String(user.code))
      );
      
      console.log(`📊 Filter results:`);
      console.log(`  - Total records: ${data.length}`);
      console.log(`  - New students: ${newStudentsData.length}`);
      console.log(`  - Duplicate students: ${duplicateStudents.length}`);
      console.log(`📝 Sample new usernames: ${newStudentsData.slice(0, 5).map(u => u.code).join(', ')}${newStudentsData.length > 5 ? '...' : ''}`);

      if (newStudentsData.length === 0) {
        return { 
          message: "No new students to insert.", 
          count: 0,
          totalRecords: data.length,
          newRecords: 0,
          duplicateRecords: duplicateStudents.length
        };
      }

      // 5. Batch create users in 3 queries max
      console.log("🔄 Batch creating users...");
      const userMap = await this.ultraBatchCreateUsers(newStudentsData);

      // 6. Process students in memory (NO database queries)
      console.log("🔄 Processing students in memory...");
      const processedStudents = await this.processStudentsInMemory(
        newStudentsData, 
        userMap, 
        referenceData
      );

      if (processedStudents.length === 0) {
        throw new Error("No valid students to insert after conversion");
      }

      // 7. Ultra optimized insert (1 query per batch)
      console.log(`🔄 Ultra inserting ${processedStudents.length} students...`);
      console.log(`📝 Sample student usernames: ${processedStudents.slice(0, 5).map(s => s.email.split('@')[0]).join(', ')}${processedStudents.length > 5 ? '...' : ''}`);
      await this.ultraInsertStudents(processedStudents);

      // 8. Clear cache
      await redis.del("user-management:students:all");

      // 9. Cleanup
      try {
        const fs = require('fs');
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (deleteError) {
        console.error(`⚠️ Failed to delete temporary file: ${file.path}`, deleteError);
      }

      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;

      this.logInfo("✅ Ultra optimized upload completed successfully", { 
        count: processedStudents.length,
        totalRows: data.length,
        newRecords: processedStudents.length,
        duplicateRecords: duplicateStudents.length,
        processingTimeSeconds: processingTime
      });

      return { 
        message: `Successfully uploaded ${processedStudents.length} new students (${duplicateStudents.length} duplicates skipped) in ${processingTime.toFixed(2)} seconds`,
        count: processedStudents.length,
        totalRecords: data.length,
        newRecords: processedStudents.length,
        duplicateRecords: duplicateStudents.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      this.logError("❌ Error in ultraOptimizedUploadStudents", error);
      throw error;
    }
  }

  // ================= ULTRA-FAST RESET STUDENTS (FASTEST METHOD) =================
  public async ultraFastResetStudents(): Promise<{ 
    message: string; 
    deletedCount: number;
    processingTimeSeconds?: number;
    totalQueries?: number;
  }> {
    const startTime = Date.now();
    
    try {
      console.log("⚡ Starting ULTRA-FAST reset process...");
      
      // Use ultra-fast DAO method
      const result = await this.userManagementDAO.ultraFastResetStudents();
      
      // Clear all related caches
      console.log("🧹 Clearing caches...");
      const cacheKeys = [
        "teacher:students:all",
        "user-management:students:all", 
        "students:all",
        "users:all"
      ];
      
      const cachePromises = cacheKeys.map(key => redis.del(key));
      await Promise.all(cachePromises);
      console.log("✅ Cleared all related caches");
      
      const endTime = Date.now();
      const totalProcessingTime = (endTime - startTime) / 1000;
      
      this.logInfo("✅ ULTRA-FAST reset completed successfully", { 
        deletedCount: result.deletedCount,
        processingTimeSeconds: totalProcessingTime,
        totalQueries: result.totalQueries
      });
      
      return {
        message: `Successfully reset all students. Deleted ${result.deletedCount} students in ${totalProcessingTime.toFixed(2)} seconds using ${result.totalQueries} queries.`,
        deletedCount: result.deletedCount,
        processingTimeSeconds: totalProcessingTime,
        totalQueries: result.totalQueries
      };
      
    } catch (error) {
      this.logError("❌ Error in ultraFastResetStudents", error);
      throw error;
    }
  }
  
  // ================= Get Reset Performance Metrics =================
  public async getResetPerformanceMetrics(): Promise<any> {
    try {
      const metrics = await this.userManagementDAO.getResetPerformanceMetrics();
      
      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logError("❌ Error getting reset performance metrics", error);
      throw error;
    }
  }
}
