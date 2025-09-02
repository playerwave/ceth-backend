import * as XLSX from "xlsx";
import { TeacherStudentDao } from "../../daos/Teacher/teacherStudent.dao";
import { Students } from "../../entity/students.entity";
import { Users } from "../../entity/users.entity";
import { ErrorHandledService } from "../error.handdled.service";
import { connectDatabase } from "../../db/database";
import bcrypt from "bcryptjs";
import { Grade } from "../../entity/grade.entity";

// Type definition for multer file
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  path: string;
  size: number;
}

// Type definition for student data from Excel
interface StudentExcelData {
  name: string;
  engName: string;
  code: string;
  major: string;
  softSkill: number;
  hardSkill: number;
}

export class TeacherStudentService extends ErrorHandledService {
  private readonly studentDao = new TeacherStudentDao();

  // ✅ แยกชื่อและนามสกุล
  private splitName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName || typeof fullName !== 'string') {
      return { firstName: '', lastName: '' };
    }
    
    const trimmedName = fullName.trim();
    const lastSpaceIndex = trimmedName.lastIndexOf(' ');
    
    if (lastSpaceIndex === -1) {
      // ถ้าไม่มี space ให้ถือว่าเป็นชื่อทั้งหมด
      return { firstName: trimmedName, lastName: '' };
    }
    
    const firstName = trimmedName.substring(0, lastSpaceIndex).trim();
    const lastName = trimmedName.substring(lastSpaceIndex + 1).trim();
    
    return { firstName, lastName };
  }

  // ✅ กำหนด level ตาม username และหา grade_id ที่ตรงกัน
  private async getGradeId(username: string): Promise<number> {
    if (!username || typeof username !== 'string') return 1;
    
    const prefix = username.substring(0, 2);
    let targetLevel: 1 | 2 | 3 | 4;
    
    switch (prefix) {
      case '66': targetLevel = 3; break;  // รุ่น 66 = ปีที่ 3 = level: 3
      case '67': targetLevel = 2; break;  // รุ่น 67 = ปีที่ 2 = level: 2
      case '68': targetLevel = 1; break;  // รุ่น 68 = ปีที่ 1 = level: 1
      case '65': targetLevel = 4; break;  // รุ่น 65 = ปีที่ 4 = level: 4
      default: return 1;                  // ถ้าไม่ตรงกับรุ่นไหน ให้เป็น grade_id: 1
    }
    
    try {
      // ✅ หา grade_id ที่มี level ตรงกับที่ต้องการ
      const connection = await connectDatabase();
      const gradeRepo = connection.getRepository(Grade);
      const grade = await gradeRepo.findOne({ where: { level: targetLevel } });
      
      if (grade) {
        console.log(`✅ Found grade: level ${targetLevel} -> grade_id: ${grade.grade_id}`);
        return grade.grade_id;
      } else {
        console.warn(`⚠️ Grade with level ${targetLevel} not found, using default grade_id: 1`);
        return 1;
      }
    } catch (error) {
      console.error(`❌ Error finding grade for level ${targetLevel}:`, error);
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
        console.log(`✅ User already exists: ${studentData.code}`);
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
      console.log(`✅ Created new user: ${studentData.code} with ID: ${savedUser.users_id}`);
      return savedUser;

    } catch (error) {
      console.error(`❌ Error creating user for ${studentData.code}:`, error);
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

        // ✅ แปลงข้อมูลเป็น student
        const student: Partial<Students> = {
          first_name_tha: thaiName.firstName,
          last_name_tha: thaiName.lastName,
          first_name_eng: engName.firstName,
          last_name_eng: engName.lastName,
          users_id: user.users_id,                      // ใช้ users_id ที่เพิ่งสร้าง
          department_id: row.major as any,             // จะแปลงเป็น ID ใน DAO
          soft_hours: row.softSkill ?? null,
          hard_hours: row.hardSkill ?? null,
          status: "Active" as "Active" | "InActive",
          // ✅ เพิ่มข้อมูลตาม requirements
          faculty_id: 1,                               // faculty_id = 1 สำหรับทุกคน
          email: `${user.username}@go.buu.ac.th`,      // email = username@go.buu.ac.th
          risk_status: "Normal" as "Normal" | "Risk",  // risk_status = Normal สำหรับทุกคน
          education_status: "Studying" as "Studying" | "Graduate", // education_status = Studying สำหรับทุกคน
          grade_id: await this.getGradeId(user.username),    // grade_id ตาม username
        };

        students.push(student);
        console.log(`✅ Converted student: ${row.name} - User ID: ${user.users_id}`);

      } catch (conversionError) {
        console.error(`❌ Error converting row for ${row.name}:`, conversionError);
      }
    }

    console.log(`✅ Converted ${students.length}/${excelData.length} students successfully`);
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
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json<StudentExcelData>(workbook.Sheets[sheetName]);

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
      console.log(`📝 Inserting ${students.length} students...`);
      await this.studentDao.insertStudents(students);

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
      console.log("🔄 Starting reset of all students...");
      
      const result = await this.studentDao.resetAllStudents();
      
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

  // ================= GET ALL USERS =================
  public async getAllUsers(): Promise<Partial<Students>[]> {
    try {
      const users = await this.studentDao.getAllUsers();
      this.logInfo("✅ Fetched all users", { count: users.length });
      return users;
    } catch (error) {
      this.logError("❌ Error in getAllUsers", error);
      throw error;
    }
  }
}
