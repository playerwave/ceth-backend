import { DataSource } from "typeorm";
import { connectDatabase } from "../../db/database";
import { Students } from "../../entity/students.entity";
import { Department } from "../../entity/department.entity";
import { ErrorHandledDao } from "../error.handled.dao";

export class UserManagementDAO extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    // ไม่เรียก initialize() ทันที เพื่อให้ test สามารถ mock ได้
  }

  private async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing UserManagementDAO...");
      this.dataSource = await connectDatabase();
      console.log("✅ UserManagementDAO initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize UserManagementDAO:", error);
      this.logDbError("initialize", error);
      throw error;
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.dataSource?.isConnected) {
      console.log("🔄 Database connection not established, attempting to initialize...");
      try {
        await this.initialize();
      } catch (error) {
        throw new Error(`❌ Database connection is not established: ${error}`);
      }
    }
  }

  /**
   * ดึง username ทั้งหมดที่มีอยู่ในระบบ
   */
  public async getAllUsernames(): Promise<{ username: string }[]> {
    try {
      await this.checkConnection();
      
      // เพิ่มการตรวจสอบ connection อีกครั้ง
      if (!this.dataSource?.isConnected) {
        console.log("🔄 Connection lost, reconnecting...");
        await this.initialize();
      }
      
      const query = `
        SELECT username 
        FROM users 
        WHERE username IS NOT NULL
        ORDER BY username
      `;
      
      const result = await this.dataSource!.query(query);
      console.log(`📊 Found ${result.length} existing usernames`);
      return result;
    } catch (error) {
      console.error("❌ Error getting all usernames:", error);
      this.logDbError("getAllUsernames", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล user ตาม username
   */
  public async getUserByUsername(username: string): Promise<any> {
    try {
      await this.checkConnection();
      
      const query = `
        SELECT u.*, s.*, d.department_name_tha
        FROM users u
        LEFT JOIN students s ON u.users_id = s.users_id
        LEFT JOIN department d ON s.department_id = d.department_id
        WHERE u.username = $1
      `;
      
      const result = await this.dataSource!.query(query, [username]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("❌ Error getting user by username:", error);
      this.logDbError("getUserByUsername", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล users หลายคนตาม usernames (batch query)
   */
  public async getUsersByUsernames(usernames: string[]): Promise<any[]> {
    try {
      await this.checkConnection();
      
      if (usernames.length === 0) return [];
      
      // สร้าง placeholders สำหรับ IN clause
      const placeholders = usernames.map((_, index) => `$${index + 1}`).join(',');
      
      const query = `
        SELECT u.*, s.*, d.department_name_tha
        FROM users u
        LEFT JOIN students s ON u.users_id = s.users_id
        LEFT JOIN department d ON s.department_id = d.department_id
        WHERE u.username IN (${placeholders})
      `;
      
      const result = await this.dataSource!.query(query, usernames);
      console.log(`📊 Found ${result.length} users for ${usernames.length} usernames`);
      return result;
    } catch (error) {
      console.error("❌ Error getting users by usernames:", error);
      this.logDbError("getUsersByUsernames", error);
      throw error;
    }
  }

  // ✅ แปลงชื่อ department เป็น department_id (รองรับทั้ง short_name และ name_tha)
  private async convertDepartmentNameToId(departmentName: string): Promise<number | null> {
    try {
      await this.checkConnection();
      const departmentRepo = this.dataSource!.getRepository(Department);
      
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
      this.logDbError("convertDepartmentNameToId", error);
      return null;
    }
  }

  // ✅ แปลงข้อมูลนักเรียนทั้งหมดให้มี department_id ที่ถูกต้อง
  private async convertStudentData(students: Partial<Students>[]): Promise<Partial<Students>[]> {
    await this.checkConnection();
    const convertedStudents: Partial<Students>[] = [];
    
    for (const student of students) {
      try {
        // ✅ ถ้ามี department_id เป็น string (ชื่อ department) ให้แปลงเป็น ID
        if (student.department_id && typeof student.department_id === 'string') {
          const departmentId = await this.convertDepartmentNameToId(student.department_id);
          
          if (departmentId !== null) {
            // ✅ แปลงข้อมูลใหม่
            const convertedStudent = {
              ...student,
              department_id: departmentId
            };
            convertedStudents.push(convertedStudent);
            console.log(`✅ Converted student: ${student.first_name_tha} - Department: ${student.department_id} -> ${departmentId}`);
          } else {
            // ✅ ถ้าไม่เจอ department ให้ข้าม
            console.warn(`⚠️ Skipping student ${student.first_name_tha} - Department not found: ${student.department_id}`);
          }
        } else {
          // ✅ ถ้า department_id เป็น number อยู่แล้ว ให้ใช้เลย
          convertedStudents.push(student);
        }
      } catch (error) {
        console.error(`❌ Error converting student data for ${student.first_name_tha}:`, error);
        this.logDbError("convertStudentData", error);
      }
    }
    
    console.log(`✅ Converted ${convertedStudents.length}/${students.length} students successfully`);
    return convertedStudents;
  }

  // ✅ insertStudents แบบ loop ป้องกัน error + connection health check
  public async insertStudents(students: Partial<Students>[]): Promise<void> {
    await this.checkConnection();
    
    try {
      // ✅ แปลงข้อมูลนักเรียนก่อน insert
      console.log("🔄 Converting student data...");
      const convertedStudents = await this.convertStudentData(students);
        
      if (convertedStudents.length === 0) {
        console.warn("⚠️ No valid students to insert after conversion");
        return;
      }
      
      const studentRepo = this.dataSource!.getRepository(Students);
      console.log(`📊 Starting to insert ${convertedStudents.length} students...`);

      // ✅ ใช้ batch insert แทน loop เพื่อประสิทธิภาพ
      const batchSize = 50; // ลดจาก 100 เป็น 50 เพื่อความเสถียร
      for (let i = 0; i < convertedStudents.length; i += batchSize) {
        const batch = convertedStudents.slice(i, i + batchSize);
        
        try {
          // ✅ ตรวจสอบ connection health ก่อนแต่ละ batch
          if (!this.dataSource!.isConnected) {
            console.log("🔄 Connection lost during batch processing, reconnecting...");
            await this.initialize();
          }
          
          await studentRepo.save(batch);
          console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(convertedStudents.length/batchSize)} (${batch.length} students)`);
          
          // ✅ รอเล็กน้อยระหว่าง batch เพื่อให้ database พัก
          if (i + batchSize < convertedStudents.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (batchError) {
          console.error(`❌ Batch insert error for batch ${Math.floor(i/batchSize) + 1}:`, batchError);
          this.logDbError("insertStudents", batchError);
          
          // ✅ ถ้า batch insert ไม่สำเร็จ ให้ insert ทีละตัว
          console.log("🔄 Falling back to individual inserts...");
          for (const student of batch) {
            try {
              // ✅ ตรวจสอบ connection health ก่อนแต่ละ insert
              if (!this.dataSource!.isConnected) {
                console.log("🔄 Connection lost during individual insert, reconnecting...");
                await this.initialize();
              }
              await studentRepo.save(student);
            } catch (individualError) {
              console.error("❌ Individual insert student error:", individualError);
              console.error("❌ Student data:", student);
              this.logDbError("insertStudents", individualError);
            }
          }
        }
      }

      console.log("✅ All students processed successfully");
        
    } catch (error) {
      this.logDbError("insertStudents", error);
      throw new Error(`Failed to insert students: ${error}`);
    }
  }

  // ================= Get All Students =================
  async getAllStudents(): Promise<any[]> {
    try {
      await this.checkConnection();
      const studentsRepository = this.dataSource!.getRepository(Students);

      const students = await studentsRepository
        .createQueryBuilder("student")
        .leftJoinAndSelect("student.department", "department")
        .leftJoinAndSelect("student.faculty", "faculty")
        .leftJoinAndSelect("student.users", "users")
        .leftJoinAndSelect("student.grade", "grade")
        .getMany();
      
      console.log(`✅ [User Management DAO] Retrieved ${students.length} students from database`);
      return students;
    } catch (error) {
      console.error("❌ [User Management DAO] Error getting all students:", error);
      this.logDbError("getAllStudents", error);
      throw error;
    }
  }

  // ================= Get Students By Department =================
  async getStudentsByDepartmentShortName(departmentShortName: string): Promise<any[]> {
    try {
      await this.checkConnection();
      const studentsRepository = this.dataSource!.getRepository(Students);
      const departmentRepository = this.dataSource!.getRepository(Department);

      // Find department by short name
      const department = await departmentRepository.findOne({
        where: { department_short_name: departmentShortName }
      });

      if (!department) {
        throw new Error(`Department with short name '${departmentShortName}' not found`);
      }

      // Get students by department
      const students = await studentsRepository
        .createQueryBuilder("student")
        .leftJoinAndSelect("student.department", "department")
        .leftJoinAndSelect("student.faculty", "faculty")
        .leftJoinAndSelect("student.users", "users")
        .where("student.department_id = :departmentId", { departmentId: department.department_id })
        .getMany();

      return students;
    } catch (error) {
      console.error("❌ [User Management DAO] Error:", error);
      this.logDbError("getStudentsByDepartmentShortName", error);
      throw error;
    }
  }

  async getAllDepartments(): Promise<any[]> {
    try {
      await this.checkConnection();
      const departmentRepository = this.dataSource!.getRepository(Department);
      const departments = await departmentRepository.find();
      return departments;
    } catch (error) {
      console.error("❌ [User Management DAO] Error:", error);
      this.logDbError("getAllDepartments", error);
      throw error;
    }
  }

  // ================= Update Grade Year =================
  /**
   * อัพเดท th_year ใน grade table (+1)
   */
  public async updateGradeYear(): Promise<any> {
    try {
      await this.checkConnection();
      
      console.log("🔄 Updating grade year (+1)...");
      
      // ดึงข้อมูล grade ทั้งหมด
      const query = `
        SELECT grade_id, th_year, level, description
        FROM grade
        ORDER BY grade_id
      `;
      
      const grades = await this.dataSource!.query(query);
      console.log(`📊 Found ${grades.length} grades to update`);
      
      const updatedGrades = [];
      
      for (const grade of grades) {
        try {
          // แปลง th_year จาก string เป็น number แล้ว +1
          const currentYear = parseInt(grade.th_year) || 0;
          const newYear = currentYear + 1;
          const newYearString = newYear.toString();
          
          // อัพเดท th_year
          const updateQuery = `
            UPDATE grade 
            SET th_year = $1 
            WHERE grade_id = $2
          `;
          
          await this.dataSource!.query(updateQuery, [newYearString, grade.grade_id]);
          
          updatedGrades.push({
            grade_id: grade.grade_id,
            level: grade.level,
            description: grade.description,
            old_th_year: grade.th_year,
            new_th_year: newYearString
          });
          
          console.log(`✅ Updated grade ${grade.level}: ${grade.th_year} -> ${newYearString}`);
          
        } catch (gradeError) {
          console.error(`❌ Error updating grade ${grade.grade_id}:`, gradeError);
          this.logDbError("updateGradeYear", gradeError);
        }
      }
      
      console.log(`✅ Updated ${updatedGrades.length}/${grades.length} grades successfully`);
      
      return {
        updatedGrades: updatedGrades.length,
        grades: updatedGrades
      };
      
    } catch (error) {
      console.error("❌ Error in updateGradeYear:", error);
      this.logDbError("updateGradeYear", error);
      throw error;
    }
  }

  /**
   * อัพเดท grade_id ของนักเรียนทุกคนตาม username prefix
   */
  public async updateStudentGrades(): Promise<any> {
    try {
      await this.checkConnection();
      
      console.log("🔄 Updating student grades based on username prefix...");
      
      // ดึงข้อมูลนักเรียนทั้งหมดพร้อม username
      const studentsQuery = `
        SELECT s.students_id, s.grade_id as current_grade_id, u.username
        FROM students s
        LEFT JOIN users u ON s.users_id = u.users_id
        WHERE u.username IS NOT NULL
        ORDER BY s.students_id
      `;
      
      const students = await this.dataSource!.query(studentsQuery);
      console.log(`📊 Found ${students.length} students to process`);
      
      // ดึงข้อมูล grade ทั้งหมดพร้อม th_year ใหม่
      const gradesQuery = `
        SELECT grade_id, th_year, level, description
        FROM grade
        ORDER BY grade_id
      `;
      
      const grades = await this.dataSource!.query(gradesQuery);
      console.log(`📊 Found ${grades.length} grades available`);
      
      // สร้าง map ของ th_year -> grade_id
      const gradeMap = new Map();
      grades.forEach(grade => {
        gradeMap.set(grade.th_year, grade.grade_id);
      });
      
      console.log("🔍 Grade mapping:", Array.from(gradeMap.entries()));
      
      const updatedStudents = [];
      let totalProcessed = 0;
      
      for (const student of students) {
        try {
          totalProcessed++;
          
          // เอา 2 หลักแรกของ username
          const usernamePrefix = student.username.substring(0, 2);
          
          // หา grade_id ที่ตรงกับ th_year
          const newGradeId = gradeMap.get(usernamePrefix);
          
          if (newGradeId && newGradeId !== student.current_grade_id) {
            // อัพเดท grade_id ของนักเรียน
            const updateQuery = `
              UPDATE students 
              SET grade_id = $1 
              WHERE students_id = $2
            `;
            
            await this.dataSource!.query(updateQuery, [newGradeId, student.students_id]);
            
            // หาข้อมูล grade ใหม่
            const newGrade = grades.find(g => g.grade_id === newGradeId);
            const oldGrade = grades.find(g => g.grade_id === student.current_grade_id);
            
            updatedStudents.push({
              students_id: student.students_id,
              username: student.username,
              username_prefix: usernamePrefix,
              old_grade_id: student.current_grade_id,
              old_grade_level: oldGrade?.level || 'Unknown',
              new_grade_id: newGradeId,
              new_grade_level: newGrade?.level || 'Unknown',
              new_grade_th_year: newGrade?.th_year || 'Unknown'
            });
            
            console.log(`✅ Updated student ${student.username}: grade ${student.current_grade_id} -> ${newGradeId} (prefix: ${usernamePrefix})`);
            
          } else if (newGradeId === student.current_grade_id) {
            console.log(`ℹ️ Student ${student.username} already has correct grade ${newGradeId}`);
          } else {
            console.warn(`⚠️ No grade found for username prefix ${usernamePrefix} (student: ${student.username})`);
          }
          
        } catch (studentError) {
          console.error(`❌ Error updating student ${student.students_id}:`, studentError);
          this.logDbError("updateStudentGrades", studentError);
        }
      }
      
      console.log(`✅ Processed ${totalProcessed} students, updated ${updatedStudents.length} students`);
      
      return {
        updatedStudents: updatedStudents.length,
        totalProcessed: totalProcessed,
        students: updatedStudents
      };
      
    } catch (error) {
      console.error("❌ Error in updateStudentGrades:", error);
      this.logDbError("updateStudentGrades", error);
      throw error;
    }
  }

  /**
   * ย้อนกลับ th_year ใน grade table (-1)
   */
  public async rollbackGradeYear(): Promise<any> {
    try {
      await this.checkConnection();
      
      console.log("🔄 Rolling back grade year (-1)...");
      
      // ดึงข้อมูล grade ทั้งหมด
      const query = `
        SELECT grade_id, th_year, level, description
        FROM grade
        ORDER BY grade_id
      `;
      
      const grades = await this.dataSource!.query(query);
      console.log(`📊 Found ${grades.length} grades to rollback`);
      
      const rolledBackGrades = [];
      
      for (const grade of grades) {
        try {
          // แปลง th_year จาก string เป็น number แล้ว -1
          const currentYear = parseInt(grade.th_year) || 0;
          const newYear = currentYear - 1;
          const newYearString = newYear.toString();
          
          // อัพเดท th_year
          const updateQuery = `
            UPDATE grade 
            SET th_year = $1 
            WHERE grade_id = $2
          `;
          
          await this.dataSource!.query(updateQuery, [newYearString, grade.grade_id]);
          
          rolledBackGrades.push({
            grade_id: grade.grade_id,
            level: grade.level,
            description: grade.description,
            old_th_year: grade.th_year,
            new_th_year: newYearString
          });
          
          console.log(`✅ Rolled back grade ${grade.level}: ${grade.th_year} -> ${newYearString}`);
          
        } catch (gradeError) {
          console.error(`❌ Error rolling back grade ${grade.grade_id}:`, gradeError);
          this.logDbError("rollbackGradeYear", gradeError);
        }
      }
      
      console.log(`✅ Rolled back ${rolledBackGrades.length}/${grades.length} grades successfully`);
      
      return {
        rolledBackGrades: rolledBackGrades.length,
        grades: rolledBackGrades
      };
      
    } catch (error) {
      console.error("❌ Error in rollbackGradeYear:", error);
      this.logDbError("rollbackGradeYear", error);
      throw error;
    }
  }
}
