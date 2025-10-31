import { TeacherStudentDao } from "../../daos/Teacher/teacherStudent.dao";
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

export class TeacherStudentService extends ErrorHandledService {
  private readonly studentDao = new TeacherStudentDao();

  // ✅ Helper method ที่ delegate ไปยัง FileProcessingUtils
  private splitName(fullName: string): { firstName: string; lastName: string } {
    return FileProcessingUtils.splitName(fullName);
  }

  // ✅ กำหนด grade_id ตาม username โดยเทียบกับ th_year
  private async getGradeId(username: string): Promise<number> {
    if (!username || typeof username !== 'string') return 1;
    
    const prefix = username.substring(0, 2);
    
    try {
      // ✅ หา grade_id ที่มี th_year ตรงกับ prefix
      const connection = await connectDatabase();
      const gradeRepo = connection.getRepository(Grade);
      const grade = await gradeRepo.findOne({ where: { th_year: prefix } });
      
      if (grade) {
        return grade.grade_id;
      } else {
        return 1;
      }
    } catch (error) {
      return 1; // fallback to default
    }
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
        console.log(`✅ Found department: ${departmentName} -> ID: ${department.department_id}`);
        return department.department_id;
      } else {
        console.warn(`⚠️ Department not found for name: ${departmentName}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error converting department name ${departmentName}:`, error);
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
      return { riskStatus: 'Normal', riskPercentage: 0 }; // fallback to Normal
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
          department_id: departmentId,                  // department_id
          soft_hours: softHours,                        // ใช้ค่าที่คำนวณแล้ว
          hard_hours: hardHours,                        // ใช้ค่าที่คำนวณแล้ว
          status: "Active" as "Active" | "InActive",
          // ✅ เพิ่มข้อมูลตาม requirements
          faculty_id: 1,                               // faculty_id = 1 สำหรับทุกคน
          email: `${user.username}@go.buu.ac.th`,      // email = username@go.buu.ac.th
          risk_status: riskResult.riskStatus,          // risk_status ตามการคำนวณ
          risk_percentage: Math.round(riskResult.riskPercentage), // risk_percentage ปัดเป็นจำนวนเต็ม
          education_status: "Studying" as "Studying" | "Graduate", // education_status = Studying สำหรับทุกคน
          grade_id: gradeId,                            // grade_id ตาม username
        };

        students.push(student);

      } catch (conversionError) {
        // Skip invalid rows silently
      }
    }

    return students;
  }

  public async uploadStudents(file: MulterFile): Promise<{ message: string; count: number; errors?: string[] }> {
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

      // ✅ แปลงข้อมูลและสร้าง users
      console.log("🔄 Converting Excel data and creating users...");
      const students = await this.convertExcelDataToStudents(data);

      if (students.length === 0) {
        throw new Error("No valid students to insert after conversion");
      }

      // ✅ Insert students
      await this.studentDao.insertStudents(students);

      // ✅ Clear cache หลังจาก insert students
      await redis.del("teacher:students:all");

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
        totalRows: data.length 
      });

      return { 
        message: `Successfully uploaded ${students.length} students`,
        count: students.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      this.logError("❌ Error in uploadStudents", error);
      throw error;
    }
  }

  // ✅ Reset ข้อมูลนิสิตทั้งหมด
  public async resetAllStudents(): Promise<{ message: string; deletedCount: number }> {
    try {
      const result = await this.studentDao.resetAllStudents();
      
      // ✅ Clear cache หลังจาก reset students
      await redis.del("teacher:students:all");
      
      this.logInfo("✅ Reset all students successfully", { deletedCount: result.deletedCount });
      
      return {
        message: `Successfully reset all students. Deleted ${result.deletedCount} students.`,
        deletedCount: result.deletedCount
      };
      
    } catch (error) {
      this.logError("❌ Error in resetAllStudents", error);
      throw error;
    }
  }

  public async resetStudentTimes(activityId: number): Promise<any> {
    try {
      const result = await this.studentDao.resetStudentTimes(activityId);
      this.logInfo("✅ Reset student times completed", { activityId, result });
      return result;
    } catch (error) {
      this.logError("❌ Error resetting student times", error);
      throw error;
    }
  }

  // ================= GET ALL USERS =================
  public async getAllUsers(): Promise<Partial<Students>[]> {
    const cacheKey = "teacher:students:all";

    try {
      // ✅ ลองดึงจาก cache ก่อน
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached students data");
        return JSON.parse(cached);
      }

      // ✅ ดึงจาก DAO
      const users = await this.studentDao.getAllUsers();
      
      // ✅ เก็บลง cache (60 วินาที)
      await redis.set(cacheKey, JSON.stringify(users), "EX", 60);
      
      this.logInfo("📤 Students data retrieved and cached", { count: users.length });
      return users;
    } catch (error) {
      this.logError("❌ Error in getAllUsers", error);
      throw error;
    }
  }

  // ================= BULK CHECK-IN/CHECK-OUT ACTIVITY =================
  public async bulkCheckInOut(
    file: MulterFile, 
    activityId: number, 
    action: 'checkin' | 'checkout'
  ): Promise<{ 
    message: string; 
    processedCount: number; 
    totalRows: number; 
    errors?: string[] 
  }> {
    const errors: string[] = [];
    
    try {
      console.log(`📁 Processing bulk ${action} file: ${file.originalname} for activity: ${activityId}`);
      
      // ✅ ตรวจสอบ file size และอ่านข้อมูลจาก Excel
      FileProcessingUtils.validateFileSize(file);
      const rawData = FileProcessingUtils.readExcelFile(file.path);
      const data = FileProcessingUtils.mapBulkEnrollmentData(rawData);
      
      console.log(`🧹 Data cleaning completed. Filtered from ${rawData.length} to ${data.length} valid rows`);
      
      // ✅ แสดงตัวอย่างข้อมูลที่ทำความสะอาดแล้ว
      FileProcessingUtils.logSampleData(data, action);

      console.log(`📊 Found ${data.length} rows in Excel file`);

      if (data.length === 0) {
        throw new Error("No data found in Excel file");
      }

      // ✅ ตรวจสอบว่ากิจกรรมมีอยู่จริง
      const activityExists = await this.studentDao.checkActivityExists(activityId);
      if (!activityExists) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }

      // ✅ ประมวลผลการ check-in/check-out
      console.log(`🔄 Processing bulk ${action}...`);
      const result = await this.studentDao.bulkCheckInOut(activityId, action, data);

      // ✅ ลบไฟล์หลังประมวลผลเสร็จ
      FileProcessingUtils.cleanupTempFile(file.path);

      this.logInfo(`✅ Bulk ${action} completed successfully`, { 
        activityId,
        action,
        processedCount: result.processedCount,
        totalRows: data.length 
      });

      const actionText = action === 'checkin' ? 'ลงชื่อเข้าร่วม' : 'ลงชื่อออก';

      return { 
        message: `Successfully ${actionText} ${result.processedCount} students in activity ${activityId}`,
        processedCount: result.processedCount,
        totalRows: data.length,
        errors: result.errors.length > 0 ? result.errors : undefined
      };

    } catch (error) {
      this.logError(`❌ Error in bulk${action.charAt(0).toUpperCase() + action.slice(1)}`, error);
      throw error;
    }
  }

  // ================= BULK ENROLL ACTIVITY =================
  public async bulkEnrollActivity(file: MulterFile, activityId: number): Promise<{ 
    message: string; 
    enrolledCount: number; 
    totalRows: number; 
    errors?: string[] 
  }> {
    const errors: string[] = [];
    
    try {
      console.log(`📁 Processing bulk enrollment file: ${file.originalname} for activity: ${activityId}`);
      
      // ✅ ตรวจสอบ file size และอ่านข้อมูลจาก Excel
      FileProcessingUtils.validateFileSize(file);
      const rawData = FileProcessingUtils.readExcelFile(file.path);
      const data = FileProcessingUtils.mapBulkEnrollmentData(rawData);
      
      console.log(`🧹 Data cleaning completed. Filtered from ${rawData.length} to ${data.length} valid rows`);
      
      // ✅ แสดงตัวอย่างข้อมูลที่ทำความสะอาดแล้ว
      FileProcessingUtils.logSampleData(data, "enrollment");

      console.log(`📊 Found ${data.length} rows in Excel file`);

      if (data.length === 0) {
        throw new Error("No data found in Excel file");
      }

      // ✅ ตรวจสอบว่ากิจกรรมมีอยู่จริง
      const activityExists = await this.studentDao.checkActivityExists(activityId);
      if (!activityExists) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }

      // ✅ ประมวลผลการลงทะเบียน
      console.log("🔄 Processing bulk enrollment...");
      const result = await this.studentDao.bulkEnrollStudents(activityId, data);

      // ✅ ลบไฟล์หลังประมวลผลเสร็จ
      FileProcessingUtils.cleanupTempFile(file.path);

      this.logInfo("✅ Bulk enrollment completed successfully", { 
        activityId,
        enrolledCount: result.enrolledCount,
        totalRows: data.length 
      });

      return { 
        message: `Successfully enrolled ${result.enrolledCount} students in activity ${activityId}`,
        enrolledCount: result.enrolledCount,
        totalRows: data.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      this.logError("❌ Error in bulkEnrollActivity", error);
      throw error;
    }
  }

  // ================= EXPORT STUDENTS TO EXCEL =================
  public async exportStudentsToExcel(): Promise<{ buffer: Buffer; filename: string }> {
    try {
      console.log("📤 Starting export students to Excel...");
      
      // ✅ ดึงข้อมูลนักเรียนพร้อมจัดเรียงตามลำดับที่กำหนด
      const students = await this.studentDao.getAllStudentsForExport();
      
      if (students.length === 0) {
        throw new Error("No students found to export");
      }
      
      console.log(`📊 Preparing to export ${students.length} students`);
      
      // Debug: Log first 2 students with hours data
      if (students.length > 0) {
        console.log("🔍 Sample students from DAO (first 2):", JSON.stringify(students.slice(0, 2).map(s => ({
          code: s.code,
          softSkill: s.softSkill,
          hardSkill: s.hardSkill,
          softSkillType: typeof s.softSkill,
          hardSkillType: typeof s.hardSkill
        })), null, 2));
      }
      
      // ✅ ดึง th_year สำหรับตั้งชื่อไฟล์
      const thYear = await this.studentDao.getCurrentYearForFilename();
      const filename = `IF-STUDENT-BUU-${thYear}.xlsx`;
      
      // ✅ Map ข้อมูลให้ตรงกับ Excel format
      const excelData = students.map((student) => ({
        'tha-name': student.tha_name.trim(),
        'eng-name': student.eng_name.trim(),
        'code': student.code,
        'major': student.major || '',
        'softSkill': student.softSkill || 0,
        'hardSkill': student.hardSkill || 0
      }));
      
      // Debug: Log first 2 mapped data
      if (excelData.length > 0) {
        console.log("🔍 Sample excel data (first 2):", JSON.stringify(excelData.slice(0, 2), null, 2));
      }
      
      // ✅ สร้าง Excel file ด้วย xlsx library
      const XLSX = require('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // ✅ ตั้งค่า column widths
      const columnWidths = [
        { wch: 30 }, // tha-name
        { wch: 30 }, // eng-name
        { wch: 12 }, // code
        { wch: 35 }, // major
        { wch: 12 }, // softSkill
        { wch: 12 }  // hardSkill
      ];
      worksheet['!cols'] = columnWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      
      // ✅ Convert workbook เป็น buffer
      const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
      });
      
      this.logInfo("✅ Export students to Excel completed successfully", { 
        count: students.length,
        filename 
      });
      
      return { buffer, filename };
    } catch (error) {
      this.logError("❌ Error in exportStudentsToExcel", error);
      throw error;
    }
  }
}
