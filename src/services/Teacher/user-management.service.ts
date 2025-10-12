import { UserManagementDAO } from "../../daos/Teacher/user-management.dao";
import { Students } from "../../entity/students.entity";
import { Users } from "../../entity/users.entity";
import { ErrorHandledService } from "../error.handdled.service";
import { connectDatabase } from "../../db/database";
import bcrypt from "bcryptjs";
import { Grade } from "../../entity/grade.entity";
import { Department } from "../../entity/department.entity";
import redis from "../../config/redis";
import { 
  FileProcessingUtils, 
  MulterFile, 
  StudentExcelData, 
  BulkEnrollmentData 
} from "../../utils/fileProcessingUtils";
import { RiskCalculator, RiskCalculationInput } from "../../utils/riskCalculator";

export class UserManagementService extends ErrorHandledService {
  private readonly userManagementDAO = new UserManagementDAO();

  // ✅ Helper method ที่ delegate ไปยัง FileProcessingUtils
  private splitName(fullName: string): { firstName: string; lastName: string } {
    return FileProcessingUtils.splitName(fullName);
  }

  // ✅ แปลงชื่อ department เป็น department_id
  private async convertDepartmentNameToId(departmentName: string): Promise<number | null> {
    try {
      const connection = await connectDatabase();
      const departmentRepo = connection.getRepository(Department);
      
      // ✅ ลองหาโดย department_short_name ก่อน
      let department = await departmentRepo.findOne({
        where: { department_short_name: departmentName }
      });
      
      // ✅ ถ้าไม่เจอ ให้ลองหาโดย department_name_tha
      if (!department) {
        department = await departmentRepo.findOne({
          where: { department_name_tha: departmentName }
        });
      }
      
      if (department) {
        return department.department_id;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  // ✅ หา EventCoop ที่ตรงกับ grade_id และ department_id
  private async getEventCoopForStudent(gradeId: number, departmentId: number): Promise<any> {
    try {
      const connection = await connectDatabase();
      const sql = `
        SELECT 
          ec.eventcoop_id,
          ec.department_id,
          ec.grade_id,
          ec.date,
          ec.remaining_days,
          ec.is_on_coop
        FROM event_coop ec
        WHERE ec.grade_id = $1 AND ec.department_id = $2
        LIMIT 1
      `;
      
      const result = await connection.query(sql, [gradeId, departmentId]);
      return result[0] || null;
    } catch (error) {
      return null;
    }
  }

  // ✅ คำนวณความเสี่ยงของนิสิต
  private async calculateStudentRisk(
    gradeId: number, 
    departmentId: number | string, 
    hardHours: number, 
    softHours: number
  ): Promise<{ riskStatus: 'Normal' | 'Risk'; riskPercentage: number }> {
    try {
      // ✅ แปลง department_id เป็น number ก่อน
      let actualDepartmentId: number;
      if (typeof departmentId === 'string') {
        const convertedId = await this.convertDepartmentNameToId(departmentId);
        if (convertedId === null) {
          return { riskStatus: 'Normal', riskPercentage: 0 };
        }
        actualDepartmentId = convertedId;
      } else {
        actualDepartmentId = departmentId;
      }

      // หา EventCoop ที่ตรงกับ grade และ department
      const eventCoop = await this.getEventCoopForStudent(gradeId, actualDepartmentId);
      
      if (!eventCoop) {
        return { riskStatus: 'Normal', riskPercentage: 0 }; // ถ้าไม่มี EventCoop ให้เป็น Normal
      }

      // ถ้าไม่ต้องไปสหกิจ ให้เป็น Normal
      if (!eventCoop.is_on_coop) {
        return { riskStatus: 'Normal', riskPercentage: 0 };
      }

      // คำนวณความเสี่ยง
      const riskInput: RiskCalculationInput = {
        hardCurrent: hardHours,
        softCurrent: softHours,
        daysLeft: eventCoop.remaining_days || 0,
        isOnCoop: eventCoop.is_on_coop
      };

      const riskResult = RiskCalculator.calculateRisk(riskInput);

      return {
        riskStatus: riskResult.riskStatus,
        riskPercentage: riskResult.riskPercent
      };
    } catch (error) {
      console.error(`❌ Error calculating student risk:`, error);
      return { riskStatus: 'Normal', riskPercentage: 0 }; // fallback to Normal
    }
  }

  // ✅ กำหนด grade_id ตาม username โดยเทียบกับ th_year
  private async getGradeId(username: string): Promise<number> {
    if (!username || typeof username !== 'string') return 1;
    
    const prefix = username.substring(0, 2);
    console.log(`🔍 [GRADE] Username: ${username}, Prefix: ${prefix}`);
    
    try {
      // ✅ หา grade_id ที่มี th_year ตรงกับ prefix
      const connection = await connectDatabase();
      const gradeRepo = connection.getRepository(Grade);
      const grade = await gradeRepo.findOne({ where: { th_year: prefix } });
      
      if (grade) {
        console.log(`✅ Found grade: th_year ${prefix} -> grade_id: ${grade.grade_id}, level: ${grade.level}`);
        return grade.grade_id;
      } else {
        console.warn(`⚠️ Grade with th_year ${prefix} not found, using default grade_id: 1`);
        return 1;
      }
    } catch (error) {
      console.error(`❌ Error finding grade for th_year ${prefix}:`, error);
      return 1; // fallback to default
    }
  }

  // ✅ สร้าง User ก่อน
  private async createUser(studentData: StudentExcelData): Promise<Users | null> {
    try {
      const connection = await connectDatabase();
      const userRepo = connection.getRepository(Users);

      // ✅ ตรวจสอบว่ามี user อยู่แล้วหรือไม่
      const existingUser = await userRepo.findOne({
        where: { username: studentData.code }
      });

      if (existingUser) {
        return existingUser;
      }

      // ✅ Hash password ก่อนสร้าง user
      const hashedPassword = await bcrypt.hash(`std_${studentData.code}`, 10);

      // ✅ สร้าง user ใหม่
      const newUser = userRepo.create({
        username: studentData.code,                    // ใช้ code จาก Excel เป็น username
        password: hashedPassword,                      // password ที่ hash แล้ว
        roles_id: 3,                                   // roles_id = 3 สำหรับนักเรียน
      });

      const savedUser = await userRepo.save(newUser);
      return savedUser;

    } catch (error) {
      return null;
    }
  }

  // ✅ แปลงข้อมูล Excel เป็นข้อมูลที่พร้อม insert
  private async convertExcelDataToStudents(excelData: StudentExcelData[]): Promise<Partial<Students>[]> {
    const students: Partial<Students>[] = [];
    
    for (const row of excelData) {
      try {
        // ✅ สร้าง user ก่อน
        const user = await this.createUser(row);
        
        if (!user) {
          console.warn(`⚠️ Skipping student ${row.name} - Failed to create user`);
          continue;
        }

        // ✅ แยกชื่อและนามสกุล
        const thaiName = this.splitName(row.name);
        const engName = this.splitName(row.engName);

        // ✅ กำหนด grade_id และ department_id
        const gradeId = await this.getGradeId(user.username);
        const departmentId = row.major as any; // จะแปลงเป็น ID ใน DAO
        
        // ✅ กำหนด soft_hours และ hard_hours ตาม grade
        let softHours = 0;
        let hardHours = 0;
        const isGrade1Or2 = gradeId === 1 || gradeId === 2;
        
        if (!isGrade1Or2) {
          // Grade 3 หรือ 4 - ใช้ค่าจาก Excel
          softHours = row.softSkill ?? 0;
          hardHours = row.hardSkill ?? 0;
        }
        // Grade 1 หรือ 2 - ใช้ค่า 0 (ไม่ต้องเปลี่ยน)

        // ✅ คำนวณความเสี่ยงจาก EventCoop
        const riskResult = await this.calculateStudentRisk(gradeId, departmentId, hardHours, softHours);

        // ✅ แปลงข้อมูลเป็น student
        const student: Partial<Students> = {
          first_name_tha: thaiName.firstName,
          last_name_tha: thaiName.lastName,
          first_name_eng: engName.firstName,
          last_name_eng: engName.lastName,
          users_id: user.users_id,                      // ใช้ users_id ที่เพิ่งสร้าง
          department_id: row.major as any,             // จะแปลงเป็น ID ใน DAO
          soft_hours: softHours,                        // ใช้ค่าที่คำนวณแล้ว
          hard_hours: hardHours,                        // ใช้ค่าที่คำนวณแล้ว
          status: "Active" as "Active" | "InActive",
          // ✅ เพิ่มข้อมูลตาม requirements
          faculty_id: 1,                               // faculty_id = 1 สำหรับทุกคน
          email: `${user.username}@go.buu.ac.th`,      // email = username@go.buu.ac.th
          risk_status: riskResult.riskStatus,          // risk_status ตามการคำนวณ
          risk_percentage: Math.round(riskResult.riskPercentage), // risk_percentage ปัดเป็นจำนวนเต็ม
          education_status: "Studying" as "Studying" | "Graduate", // education_status = Studying สำหรับทุกคน
          grade_id: gradeId,                             // ใช้ค่าที่คำนวณแล้ว
        };

        students.push(student);

      } catch (conversionError) {
        console.error(`❌ Error converting row for ${row.name}:`, conversionError);
      }
    }

    return students;
  }

  public async uploadStudents(file: MulterFile): Promise<{ 
    message: string; 
    count: number; 
    totalRecords?: number;
    newRecords?: number;
    duplicateRecords?: number;
    errors?: string[] 
  }> {
    const errors: string[] = [];
    
    try {
      console.log(`📁 Processing file: ${file.originalname}`);
      
      // ✅ ตรวจสอบ file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit");
      }

      // ✅ อ่านข้อมูลจาก Excel
      const data = FileProcessingUtils.readExcelFile<StudentExcelData>(file.path);

      console.log(`📊 Found ${data.length} rows in Excel file`);

      if (data.length === 0) {
        throw new Error("No data found in Excel file");
      }

      // 🔍 ดึง username ที่มีอยู่ทั้งหมดใน database
      console.log("🔍 [UPLOAD] Fetching existing usernames...");
      const existingUsernames = await this.userManagementDAO.getAllUsernames();
      const existingUsernameSet = new Set(existingUsernames.map(u => u.username));
      console.log(`🔍 [UPLOAD] Found ${existingUsernames.length} existing usernames`);

      // 🔍 กรองข้อมูลใหม่ก่อนแปลง
      const newStudentsData: StudentExcelData[] = [];
      const duplicateStudents: string[] = [];
      
      for (const user of data) {
        const username = String(user.code);
        if (!existingUsernameSet.has(username)) {
          newStudentsData.push(user);
        } else {
          duplicateStudents.push(username);
          console.log(`✅ User already exists (skipped): ${username}`);
        }
      }

      console.log(`📊 [UPLOAD] Summary:`);
      console.log(`  - Total records: ${data.length}`);

      if (newStudentsData.length === 0) {
        return { 
          message: "No new students to insert.", 
          count: 0,
          totalRecords: data.length,
          newRecords: 0,
          duplicateRecords: duplicateStudents.length
        };
      }

      // ✅ แปลงข้อมูลและสร้าง users (เฉพาะข้อมูลใหม่)
      console.log("🔄 Converting Excel data and creating users...");
      const students = await this.convertExcelDataToStudents(newStudentsData);

      if (students.length === 0) {
        throw new Error("No valid students to insert after conversion");
      }

      // ✅ Insert students (เฉพาะข้อมูลใหม่)
      await this.userManagementDAO.insertStudents(students);

      // ✅ Clear cache หลังจาก insert students
      await redis.del("user-management:students:all");

      // ✅ ลบไฟล์หลังประมวลผลเสร็จ
      try {
        const fs = require('fs');
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`🗑️ Deleted temporary file: ${file.path}`);
        }
      } catch (deleteError) {
        console.error(`⚠️ Failed to delete temporary file: ${file.path}`, deleteError);
      }

      this.logInfo("✅ Uploaded students successfully", { 
        count: students.length,
        totalRows: data.length,
        newRecords: students.length,
        duplicateRecords: duplicateStudents.length
      });

      return { 
        message: `Successfully uploaded ${students.length} new students (${duplicateStudents.length} duplicates skipped)`,
        count: students.length,
        totalRecords: data.length,
        newRecords: students.length,
        duplicateRecords: duplicateStudents.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      this.logError("❌ Error in uploadStudents", error);
      throw error;
    }
  }

  // ================= Get All Students =================
  async getAllStudents(): Promise<any> {
    try {
      console.log("🔍 [User Management Service] Getting all students");
      
      const students = await this.userManagementDAO.getAllStudents();
      
      // ✅ Map students to include username
      const mappedStudents = students.map(student => ({
        ...student,
        username: student.users?.username || student.username || 'ไม่ระบุ'
      }));
      
      console.log(`✅ [User Management Service] Retrieved ${mappedStudents.length} students`);
      
      return {
        success: true,
        data: mappedStudents,
        count: mappedStudents.length
      };
    } catch (error) {
      console.error("❌ [User Management Service] Error getting all students:", error);
      throw error;
    }
  }

  // ================= Get Students By Department =================
  async getStudentsByDepartment(departmentShortName: string): Promise<any> {
    try {
      
      const students = await this.userManagementDAO.getStudentsByDepartmentShortName(departmentShortName);
      
      
      // ✅ Debug: Log first student data structure
      if (students.length > 0) {
      }
      
      // ✅ Map students to include username
      const mappedStudents = students.map(student => ({
        ...student,
        username: student.users?.username || student.username || 'ไม่ระบุ'
      }));
      
      return {
        success: true,
        data: mappedStudents,
        department: departmentShortName,
        count: mappedStudents.length
      };
    } catch (error) {
      console.error("❌ [User Management Service] Error:", error);
      throw error;
    }
  }

  async getAllDepartments(): Promise<any> {
    try {
      console.log("🔍 [User Management Service] Getting all departments");
      
      const departments = await this.userManagementDAO.getAllDepartments();
      
      console.log(`📊 [User Management Service] Found ${departments.length} departments`);
      
      return {
        success: true,
        data: departments,
        count: departments.length
      };
    } catch (error) {
      console.error("❌ [User Management Service] Error:", error);
      throw error;
    }
  }

  // ================= Review Upload Data =================
  public async reviewUploadData(file: MulterFile): Promise<any> {
    try {
      console.log(`📁 Processing file for review: ${file.originalname}`);
      
      // อ่านข้อมูลจาก Excel
      const data = FileProcessingUtils.readExcelFile<StudentExcelData>(file.path);
      console.log(`📊 Found ${data.length} rows in Excel file`);

      if (data.length === 0) {
        throw new Error("No data found in Excel file");
      }

      // 🔍 [DEBUG] แสดงข้อมูลดิบจากไฟล์ที่อ่านได้
      
      // 🔍 [DEBUG] ตรวจสอบ username 65160397 โดยเฉพาะ
      const targetUsername = '65160397';
      const foundTarget = data.find(user => String(user.code) === targetUsername);
      console.log(`🔍 [DEBUG] Looking for username ${targetUsername}:`, foundTarget ? 'FOUND' : 'NOT FOUND');
      if (foundTarget) {
        console.log(`🔍 [DEBUG] Target user data:`, foundTarget);
      }

      // 🔄 Clear cache ก่อนดึงข้อมูลใหม่
      console.log("🔄 [REVIEW] Clearing cache before fetching usernames...");
      await redis.del("user-management:students:all");
      await redis.del("teacher:students:all");
      
      // ดึง username ทั้งหมดที่มีอยู่ในระบบ
      let existingUsernames: any[] = [];
      try {
        console.log("🔍 [REVIEW] Starting to fetch existing usernames...");
        existingUsernames = await this.userManagementDAO.getAllUsernames();
        console.log(`🔍 [REVIEW] Found ${existingUsernames.length} existing usernames in database`);
        console.log(`🔍 [REVIEW] First 5 existing usernames:`, existingUsernames.slice(0, 5));
        console.log(`🔍 [REVIEW] Sample usernames:`, existingUsernames.slice(0, 10).map(u => u.username));
      } catch (dbError) {
        console.error("❌ [REVIEW] Database connection error during review:", dbError);
        throw new Error("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      }
      
      const existingUsernameSet = new Set(existingUsernames.map(u => u.username));
      console.log(`🔍 [REVIEW] Username set size: ${existingUsernameSet.size}`);
      console.log(`🔍 [REVIEW] First 5 Excel usernames:`, data.slice(0, 5).map(u => u.code));
      
      // ตรวจสอบว่า username จาก Excel อยู่ใน database หรือไม่
      const sampleExcelUsernames = data.slice(0, 5).map(u => u.code);
      console.log(`🔍 [REVIEW] Checking if Excel usernames exist in database:`);
      sampleExcelUsernames.forEach(username => {
        const usernameStr = String(username); // แปลงเป็น string
        const exists = existingUsernameSet.has(usernameStr);
        console.log(`🔍 [REVIEW] ${username} (${typeof username}) -> ${usernameStr} (${typeof usernameStr}) exists: ${exists}`);
      });
      
      // ตรวจสอบว่า username ใน database มีรูปแบบไหนบ้าง
      const sampleDbUsernames = existingUsernames.slice(0, 10).map(u => u.username);
      console.log(`🔍 [REVIEW] Sample database usernames:`, sampleDbUsernames);
      
      // ตรวจสอบว่า username ใน Excel มีรูปแบบไหนบ้าง
      const sampleExcelUsernames2 = data.slice(0, 10).map(u => u.code);
      console.log(`🔍 [REVIEW] Sample Excel usernames:`, sampleExcelUsernames2);
      
      // 🔍 ตรวจสอบ username ใหม่ที่อาจจะไม่มีใน database
      console.log(`🔍 [REVIEW] Checking for new usernames...`);
      const excelUsernames = data.map(u => String(u.code));
      const newUsernames = excelUsernames.filter(username => !existingUsernameSet.has(username));
      console.log(`🔍 [REVIEW] Found ${newUsernames.length} new usernames:`, newUsernames.slice(0, 5));
      
      // 🔍 ตรวจสอบ username ที่มีใน database แต่ไม่มีในไฟล์
      const dbUsernames = existingUsernames.map(u => u.username);
      const missingFromFile = dbUsernames.filter(username => !excelUsernames.includes(username));
      console.log(`🔍 [REVIEW] Database usernames not in file:`, missingFromFile.slice(0, 5));

      const duplicateDetails: any[] = [];
      const newUserDetails: any[] = [];

      // ตรวจสอบแต่ละ user (ใช้ batch query เพื่อความเร็ว)
      console.log("🔍 [REVIEW] Processing users in batches...");
      
      for (const user of data) {
        const username = String(user.code); // แปลงเป็น string ก่อน
        
        if (existingUsernameSet.has(username)) {
          // ข้อมูลซ้ำ - เก็บไว้ก่อน (ไม่ query database ทันที)
          duplicateDetails.push({
            username: username,
            existingUser: null, // จะ query ภายหลัง
            newUser: user
          });
        } else {
          // ข้อมูลใหม่
          newUserDetails.push(user);
        }
      }
      
      console.log(`🔍 [REVIEW] Found ${duplicateDetails.length} duplicates, ${newUserDetails.length} new records`);
      
      // Query ข้อมูลซ้ำแบบ batch (ถ้าจำเป็น)
      if (duplicateDetails.length > 0) {
        console.log("🔍 [REVIEW] Fetching duplicate user details...");
        const duplicateUsernames = duplicateDetails.map(d => d.username);
        const existingUsers = await this.userManagementDAO.getUsersByUsernames(duplicateUsernames);
        
        // Map ข้อมูลกลับ
        const existingUserMap = new Map(existingUsers.map(u => [u.username, u]));
        duplicateDetails.forEach(detail => {
          detail.existingUser = existingUserMap.get(detail.username);
        });
      }

      const totalRecords = data.length;
      const duplicateRecords = duplicateDetails.length;
      const newRecords = newUserDetails.length;

      const result = {
        totalRecords,
        duplicateRecords,
        newRecords,
        duplicateDetails,
        newUserDetails,
        summary: {
          duplicatesPercentage: totalRecords > 0 ? (duplicateRecords / totalRecords) * 100 : 0,
          newRecordsPercentage: totalRecords > 0 ? (newRecords / totalRecords) * 100 : 0
        }
      };

      return result;
    } catch (error) {
      console.error("❌ Error in reviewUploadData:", error);
      throw error;
    }
  }

  // ================= Update Grade Year =================
  public async updateGradeYear(): Promise<any> {
    try {
      console.log("🔄 Starting grade year update process...");
      
      // 1. อัพเดท th_year ใน grade table (+1)
      const gradeUpdateResult = await this.userManagementDAO.updateGradeYear();
      console.log("✅ Grade year update result:", gradeUpdateResult);
      
      // 2. อัพเดท grade_id ของนักเรียนทุกคนตาม username prefix
      const studentUpdateResult = await this.userManagementDAO.updateStudentGrades();
      
      const result = {
        gradeUpdate: gradeUpdateResult,
        studentUpdate: studentUpdateResult,
        summary: {
          gradesUpdated: gradeUpdateResult.updatedGrades,
          studentsUpdated: studentUpdateResult.updatedStudents,
          totalProcessed: studentUpdateResult.totalProcessed
        }
      };
      
      console.log("✅ Grade year update completed successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in updateGradeYear:", error);
      throw error;
    }
  }

  // ================= Rollback Grade Year =================
  public async rollbackGradeYear(): Promise<any> {
    try {
      console.log("🔄 Starting grade year rollback process...");
      
      // 1. ย้อนกลับ th_year ใน grade table (-1)
      const gradeRollbackResult = await this.userManagementDAO.rollbackGradeYear();
      console.log("✅ Grade year rollback result:", gradeRollbackResult);
      
      // 2. อัพเดท grade_id ของนักเรียนทุกคนตาม username prefix
      const studentUpdateResult = await this.userManagementDAO.updateStudentGrades();
      
      const result = {
        gradeRollback: gradeRollbackResult,
        studentUpdate: studentUpdateResult,
        summary: {
          gradesRolledBack: gradeRollbackResult.rolledBackGrades,
          studentsUpdated: studentUpdateResult.updatedStudents,
          totalProcessed: studentUpdateResult.totalProcessed
        }
      };
      
      console.log("✅ Grade year rollback completed successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in rollbackGradeYear:", error);
      throw error;
    }
  }
}
