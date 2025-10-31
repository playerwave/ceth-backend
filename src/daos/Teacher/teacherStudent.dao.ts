import { DataSource } from "typeorm";
import { connectDatabase } from "../../db/database";
import { Students } from "../../entity/students.entity";
import { Department } from "../../entity/department.entity";
import { ErrorHandledDao } from "../error.handled.dao";

export class TeacherStudentDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    // ไม่เรียก initialize() ทันที เพื่อให้ test สามารถ mock ได้
  }

  private async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing TeacherStudentDao...");
      this.dataSource = await connectDatabase();
      console.log("✅ TeacherStudentDao initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize TeacherStudentDao:", error);
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

  // ✅ ดึง Users ทั้งหมด
  public async getAllUsers(): Promise<Students[]> {
    await this.checkConnection();
    
    try {
      const studentRepo = this.dataSource!.getRepository(Students);
      const users = await studentRepo.find();
      console.log(`✅ Fetched ${users.length} users successfully`);
      return users;
    } catch (error) {
      this.logDbError("getAllUsers", error);
      throw new Error(`Failed to fetch users: ${error}`);
    }
  }

  // ✅ ดึง User โดย ID
  public async getUserById(id: number): Promise<Students | null> {
    await this.checkConnection();
    
    try {
      const studentRepo = this.dataSource!.getRepository(Students);
      const user = await studentRepo.findOne({ where: { students_id: id } });
      
      if (user) {
        console.log(`✅ Found user with ID: ${id}`);
      } else {
        console.log(`⚠️ No user found with ID: ${id}`);
      }
      
      return user;
    } catch (error) {
      this.logDbError("getUserById", error);
      throw new Error(`Failed to fetch user by ID ${id}: ${error}`);
    }
  }

  // ✅ อัพเดท User
  public async updateUser(id: number, updateData: Partial<Students>): Promise<Students | null> {
    await this.checkConnection();
    
    try {
      const studentRepo = this.dataSource!.getRepository(Students);
      
      // ✅ ตรวจสอบว่ามี user อยู่หรือไม่
      const existingUser = await studentRepo.findOne({ where: { students_id: id } });
      if (!existingUser) {
        console.warn(`⚠️ User with ID ${id} not found for update`);
        return null;
      }
      
      // ✅ อัพเดทข้อมูล
      const updatedUser = await studentRepo.save({
        ...existingUser,
        ...updateData
      });
      
      console.log(`✅ Updated user with ID: ${id}`);
      return updatedUser;
    } catch (error) {
      this.logDbError("updateUser", error);
      throw new Error(`Failed to update user ${id}: ${error}`);
    }
  }

  // ✅ ลบ User
  public async deleteUser(id: number): Promise<boolean> {
    await this.checkConnection();
    
    try {
      const studentRepo = this.dataSource!.getRepository(Students);
      
      // ✅ ตรวจสอบว่ามี user อยู่หรือไม่
      const existingUser = await studentRepo.findOne({ where: { students_id: id } });
      if (!existingUser) {
        console.warn(`⚠️ User with ID ${id} not found for deletion`);
        return false;
      }
      
      // ✅ ลบ user
      await studentRepo.remove(existingUser);
      
      console.log(`✅ Deleted user with ID: ${id}`);
      return true;
    } catch (error) {
      this.logDbError("deleteUser", error);
      throw new Error(`Failed to delete user ${id}: ${error}`);
    }
  }

  // ✅ ดึงข้อมูลนักเรียนทั้งหมดพร้อมจัดเรียงตามลำดับที่กำหนด
  public async getAllStudentsForExport(): Promise<Array<{
    tha_name: string;
    eng_name: string;
    code: string;
    major: string;
    softSkill: number;
    hardSkill: number;
    department_short_name: string;
    grade_level: number | null;
    grade_th_year: string | null;
  }>> {
    await this.checkConnection();
    
    try {
      console.log("📥 Fetching all students for export...");
      
      const query = `
        SELECT 
          COALESCE(s.first_name_tha, '') || ' ' || COALESCE(s.last_name_tha, '') as tha_name,
          COALESCE(s.first_name_eng, '') || ' ' || COALESCE(s.last_name_eng, '') as eng_name,
          u.username as code,
          d.department_name_tha as major,
          COALESCE(s.soft_hours, 0) as softSkill,
          COALESCE(s.hard_hours, 0) as hardSkill,
          d.department_short_name,
          g.level as grade_level,
          g.th_year as grade_th_year
        FROM students s
        JOIN users u ON s.users_id = u.users_id
        JOIN department d ON s.department_id = d.department_id
        LEFT JOIN grade g ON s.grade_id = g.grade_id
        ORDER BY 
          CASE d.department_short_name
            WHEN 'AAI' THEN 1
            WHEN 'SE' THEN 2
            WHEN 'CS' THEN 3
            WHEN 'IT' THEN 4
            ELSE 5
          END,
          COALESCE(g.level::text::integer, 99)
      `;
      
      const result = await this.dataSource!.query(query);
      
      console.log(`✅ Retrieved ${result.length} students for export`);
      
      // Log sample data to debug
      if (result.length > 0) {
        console.log("🔍 Sample student data (first 2):", JSON.stringify(result.slice(0, 2), null, 2));
      }
      
      return result;
    } catch (error) {
      this.logDbError("getAllStudentsForExport", error);
      throw new Error("Failed to fetch students for export");
    }
  }

  // ✅ ดึงข้อมูล th_year ของ grade_id = 1 สำหรับตั้งชื่อไฟล์
  public async getCurrentYearForFilename(): Promise<string> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        'SELECT th_year FROM grade WHERE grade_id = 1 LIMIT 1'
      );
      
      if (result.length > 0 && result[0].th_year) {
        return result[0].th_year;
      }
      
      // Fallback to current year if not found
      return new Date().getFullYear().toString().slice(-2);
    } catch (error) {
      this.logDbError("getCurrentYearForFilename", error);
      return new Date().getFullYear().toString().slice(-2);
    }
  }

  // ✅ Reset ข้อมูลนิสิตทั้งหมดและ reset sequence
  public async resetAllStudents(): Promise<{ deletedCount: number }> {
    await this.checkConnection();
    
    try {
        
      console.log("🔄 Starting reset of all students...");
      
      // 🔥 ลบข้อมูลในตาราง users ที่มี roles_id = 3 (Student) เสมอ
      try {
        const usersResult = await this.dataSource!.query('DELETE FROM users WHERE roles_id = 3');
        console.log(`✅ Deleted ${usersResult.length || 0} student users from users table`);
      } catch (error) {
        console.warn("⚠️ Could not delete student users:", error.message);
      }
      
      // ✅ นับจำนวนนักเรียนก่อนลบ
      const studentRepo = this.dataSource!.getRepository(Students);
        const totalStudents = await studentRepo.count();
        console.log(`📊 Found ${totalStudents} students to delete`);
        
        if (totalStudents === 0) {
          console.log("✅ No students to delete");
          return { deletedCount: 0 };
        }
        
      // ✅ ลบข้อมูลที่เกี่ยวข้องก่อน (ตามลำดับ Foreign Key)
      console.log("🔄 Deleting related data first...");
      
      // ลบข้อมูลในตาราง join ที่อ้างอิง students
      try {
        const joinResult = await this.dataSource!.query('DELETE FROM "join" WHERE students_id IS NOT NULL');
        console.log(`✅ Deleted ${joinResult.length || 0} related join records`);
      } catch (error) {
        console.warn("⚠️ Could not delete join data:", error.message);
      }
        
      // ลบข้อมูลในตาราง certificate ที่อ้างอิง students
      try {
        const certResult = await this.dataSource!.query('DELETE FROM certificate WHERE students_id IS NOT NULL');
        console.log(`✅ Deleted ${certResult.length || 0} related certificate records`);
      } catch (error) {
        console.warn("⚠️ Could not delete certificate data:", error.message);
      }
        
      // ลบข้อมูลในตาราง answer ที่อ้างอิง join (ถ้ามี)
      try {
        const answerResult = await this.dataSource!.query('DELETE FROM answer WHERE join_id IN (SELECT join_id FROM "join" WHERE students_id IS NOT NULL)');
        console.log(`✅ Deleted ${answerResult.length || 0} related answer records`);
      } catch (error) {
        console.warn("⚠️ Could not delete answer data:", error.message);
      }
      
        
        // ✅ ลบนักเรียนทั้งหมดทีละคน (ไม่ใช้ clear() เพราะมี FK constraints)
        console.log("🔄 Deleting all students one by one...");
        const students = await studentRepo.find();
        let deletedCount = 0;
        
        for (const student of students) {
          try {
            await studentRepo.remove(student);
            deletedCount++;
            if (deletedCount % 50 === 0) {
              console.log(`🔄 Deleted ${deletedCount}/${totalStudents} students...`);
            }
          } catch (error) {
            console.error(`❌ Failed to delete student ${student.students_id}:`, error.message);
          }
        }
        
        console.log(`✅ Successfully deleted ${deletedCount} students`);
        
      // ✅ Reset sequence ให้เริ่มที่ 1 ใหม่
      try {
        await this.dataSource!.query('ALTER SEQUENCE IF EXISTS students_students_id_seq RESTART WITH 1');
        console.log("✅ Reset student_id sequence to start from 1");
      } catch (seqError) {
        console.warn("⚠️ Could not reset sequence, but students were deleted successfully");
      }
        
      return { deletedCount };
        
    } catch (error) {
      this.logDbError("resetAllStudents", error);
      throw new Error(`Failed to reset students: ${error}`);
    }
  }

  public async resetStudentTimes(activityId: number): Promise<any> {
    await this.checkConnection();
    
    try {
      console.log(`🔄 Starting reset student times for activity ${activityId}...`);
      
      // 1. หาจำนวน records ที่จะ reset
      const countQuery = `
        SELECT COUNT(*) as activity_detail_count
        FROM activity_detail
        WHERE activity_id = $1
      `;
      
      const countResult = await this.dataSource!.query(countQuery, [activityId]);
      const count = countResult[0].activity_detail_count;
      
      console.log(`📊 Found ${count} activity detail records to reset times`);
      
      // 2. Reset time_in และ time_out เป็น NULL
      const resetTimesQuery = `
        UPDATE activity_detail
        SET 
          time_in = NULL,
          time_out = NULL
        WHERE activity_id = $1
        RETURNING activity_detail_id, time_in, time_out
      `;
      
      const resetResult = await this.dataSource!.query(resetTimesQuery, [activityId]);
      console.log(`✅ Reset ${resetResult.length} activity detail records`);
      
      const result = {
        activityId,
        activityDetailsReset: resetResult.length,
        message: `Reset time_in and time_out to NULL for activity ${activityId}`,
        details: {
          resetRecords: resetResult
        }
      };
      
      console.log(`✅ Reset student times completed for activity ${activityId}`);
      return result;
    } catch (error) {
      this.logDbError("resetStudentTimes", error);
      throw new Error(`Failed to reset student times: ${error}`);
    }
  }

  // ✅ ตรวจสอบว่ากิจกรรมมีอยู่จริง
  public async checkActivityExists(activityId: number): Promise<boolean> {
    await this.checkConnection();
    
    try {
      const result = await this.dataSource!.query(
        'SELECT activity_id FROM activity WHERE activity_id = $1 AND status = \'Active\'',
        [activityId]
      );
      
      const exists = result.length > 0;
      console.log(`✅ Activity ${activityId} exists: ${exists}`);
      return exists;
    } catch (error) {
      this.logDbError("checkActivityExists", error);
      throw new Error(`Failed to check activity ${activityId}: ${error}`);
    }
  }

  // ✅ Bulk Check-in/Check-out นักเรียนหลายคนในกิจกรรม
  public async bulkCheckInOut(
    activityId: number,
    action: 'checkin' | 'checkout',
    checkInOutData: Array<{ timestamp: string; studentId: string; name: string; department: string; email: string }>
  ): Promise<{ processedCount: number; errors: string[] }> {
    await this.checkConnection();
    
    try {
        
        console.log(`🔄 Starting bulk ${action} for activity ${activityId} with ${checkInOutData.length} students`);
        
        let processedCount = 0;
        const errors: string[] = [];
        
      // ✅ ตรวจสอบว่ากิจกรรมมีอยู่และดึง activity_state
      const activityResult = await this.dataSource!.query(
        'SELECT activity_id, activity_state FROM activity WHERE activity_id = $1 AND status = \'Active\'',
        [activityId]
      );
        
        if (activityResult.length === 0) {
          throw new Error(`Activity with ID ${activityId} not found or inactive`);
        }
        
        const activityData = activityResult[0];
        console.log(`🔍 Activity state: ${activityData.activity_state}`);
        
        // ✅ ตรวจสอบ activity_state ตาม action
        if (action === 'checkin' && activityData.activity_state !== 'Start Activity') {
          throw new Error('กิจกรรมนี้ยังไม่เปิดให้ลงชื่อเข้าร่วม');
        } else if (action === 'checkout' && activityData.activity_state !== 'End Activity') {
          throw new Error('กิจกรรมนี้ยังไม่เปิดให้ลงชื่อออก');
        }
        
        // ✅ ใช้ batch processing เพื่อความเสถียร
        const batchSize = 10;
        for (let i = 0; i < checkInOutData.length; i += batchSize) {
          const batch = checkInOutData.slice(i, i + batchSize);
          
          try {
            // ✅ ตรวจสอบ connection health ก่อนแต่ละ batch
            if (!this.dataSource!.isConnected) {
              console.log("🔄 Connection lost during batch processing, reconnecting...");
              await this.initialize();
            }
            
            console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(checkInOutData.length/batchSize)} (${batch.length} students)`);
            
            // ✅ ประมวลผล batch นี้
            for (const data of batch) {
              try {
                // ✅ ตรวจสอบข้อมูลที่จำเป็น
                if (!data.studentId || !data.timestamp) {
                  errors.push(`Missing studentId or timestamp for: ${data.name || 'unknown'}`);
                  continue;
                }
                
                console.log(`🔄 Processing ${action} for student: ${data.studentId}`);
                
                // ✅ หา user โดย username (รหัสนิสิต)
                const userResult = await this.dataSource!.query(
                  'SELECT users_id FROM users WHERE username = $1',
                  [data.studentId]
                );
                
                if (userResult.length === 0) {
                  errors.push(`User not found for student ID: ${data.studentId}`);
                  continue;
                }
                
                const userId = userResult[0].users_id;
                
                // ✅ หา student โดย users_id
                const studentResult = await this.dataSource!.query(
                  'SELECT students_id FROM students WHERE users_id = $1',
                  [userId]
                );
                
                if (studentResult.length === 0) {
                  errors.push(`Student not found for user ID: ${userId}`);
                  continue;
                }
                
                const studentId = studentResult[0].students_id;
                
                // ✅ ตรวจสอบว่าลงทะเบียนแล้วหรือไม่และดึงข้อมูล enrollment
                const enrollmentResult = await this.dataSource!.query(
                  `SELECT j.join_id, ad.time_in, ad.time_out, ad.activity_detail_id 
                   FROM activity_detail ad 
                   JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id 
                   WHERE ad.activity_id = $1 AND j.students_id = $2`,
                  [activityId, studentId]
                );
                
                if (enrollmentResult.length === 0) {
                  errors.push(`Student ${data.studentId} is not enrolled in activity ${activityId}`);
                  continue;
                }
                
                const enrollment = enrollmentResult[0];
                
                // ✅ ใช้เวลาปัจจุบันสำหรับ check-in/check-out
                const actionDate = new Date(); // เวลาปัจจุบัน ณ ตอนที่ทำ bulk check-in/check-out
                
                // ✅ ดำเนินการตาม action
                if (action === 'checkin') {
                  // ตรวจสอบว่า check-in แล้วหรือไม่
                  if (enrollment.time_in) {
                    errors.push(`Student ${data.studentId} already checked in`);
                    continue;
                  }
                  
                  // Update time_in
                  await this.dataSource!.query(
                    `UPDATE activity_detail SET time_in = $1 WHERE activity_detail_id = $2`,
                    [actionDate, enrollment.activity_detail_id]
                  );
                  
                  console.log(`✅ Checked in student ${data.studentId} at ${actionDate.toLocaleString('th-TH')}`);
                  
                } else if (action === 'checkout') {
                  // ตรวจสอบว่า check-in แล้วหรือไม่
                  if (!enrollment.time_in) {
                    errors.push(`Student ${data.studentId} has not checked in yet`);
                    continue;
                  }
                  
                  // ตรวจสอบว่า check-out แล้วหรือไม่
                  if (enrollment.time_out) {
                    errors.push(`Student ${data.studentId} already checked out`);
                    continue;
                  }
                  
                  // Update time_out
                  await this.dataSource!.query(
                    `UPDATE activity_detail SET time_out = $1 WHERE activity_detail_id = $2`,
                    [actionDate, enrollment.activity_detail_id]
                  );
                  
                  console.log(`✅ Checked out student ${data.studentId} at ${actionDate.toLocaleString('th-TH')}`);
                }
                
                processedCount++;
                
              } catch (studentError) {
                console.error(`❌ Error processing ${action} for student ${data.studentId}:`, studentError);
                errors.push(`Error processing ${data.studentId}: ${studentError.message}`);
              }
            }
            
            console.log(`✅ Completed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(checkInOutData.length/batchSize)}`);
            
            // ✅ รอเล็กน้อยระหว่าง batch เพื่อให้ database พัก
            if (i + batchSize < checkInOutData.length) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
          } catch (batchError) {
            console.error(`❌ Batch processing error for batch ${Math.floor(i/batchSize) + 1}:`, batchError);
            errors.push(`Batch error: ${batchError.message}`);
          }
        }
        
      console.log(`✅ Bulk ${action} completed. Successfully processed ${processedCount}/${checkInOutData.length} students`);
      return { processedCount, errors };
        
    } catch (error) {
      this.logDbError(`bulk${action.charAt(0).toUpperCase() + action.slice(1)}`, error);
      throw new Error(`Failed to bulk ${action} students: ${error}`);
    }
  }

  

  // ✅ ลงทะเบียนนักเรียนหลายคนในกิจกรรม
  public async bulkEnrollStudents(
    activityId: number, 
    enrollmentData: Array<{ timestamp: string; studentId: string; name: string; department: string; email: string }>
  ): Promise<{ enrolledCount: number }> {
    await this.checkConnection();
    
    try {
        
        console.log(`🔄 Starting bulk enrollment for activity ${activityId} with ${enrollmentData.length} students`);
        
        let enrolledCount = 0;
        
        // ✅ ใช้ batch processing เพื่อความเสถียร
        const batchSize = 10; // ลด batch size เพื่อความเสถียร
        for (let i = 0; i < enrollmentData.length; i += batchSize) {
          const batch = enrollmentData.slice(i, i + batchSize);
          
          try {
            // ✅ ตรวจสอบ connection health ก่อนแต่ละ batch
            if (!this.dataSource!.isConnected) {
              console.log("🔄 Connection lost during batch processing, reconnecting...");
              await this.initialize();
            }
            
            console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(enrollmentData.length/batchSize)} (${batch.length} students)`);
            
            // ✅ ประมวลผล batch นี้
            for (const data of batch) {
              try {
                // ✅ ตรวจสอบข้อมูลที่จำเป็น
                if (!data.studentId || !data.timestamp) {
                  console.warn(`⚠️ Skipping row: missing studentId or timestamp`, data);
                  continue;
                }
                
                console.log(`🔄 Processing student: ${data.studentId}`);
                
                // ✅ หา user โดย username (รหัสนิสิต)
                const userResult = await this.dataSource!.query(
                  'SELECT users_id FROM users WHERE username = $1',
                  [data.studentId]
                );
                
                if (userResult.length === 0) {
                  console.warn(`⚠️ User not found for student ID: ${data.studentId}`);
                  continue;
                }
                
                const userId = userResult[0].users_id;
                
                // ✅ หา student โดย users_id
                const studentResult = await this.dataSource!.query(
                  'SELECT students_id FROM students WHERE users_id = $1',
                  [userId]
                );
                
                if (studentResult.length === 0) {
                  console.warn(`⚠️ Student not found for user ID: ${userId}`);
                  continue;
                }
                
                const studentId = studentResult[0].students_id;
                
                // ✅ ตรวจสอบว่าลงทะเบียนแล้วหรือไม่
                const existingEnrollment = await this.dataSource!.query(
                  `SELECT 1 FROM activity_detail ad 
                   JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id 
                   WHERE ad.activity_id = $1 AND j.students_id = $2`,
                  [activityId, studentId]
                );
                
                if (existingEnrollment.length > 0) {
                  console.log(`✅ Student ${data.studentId} already enrolled in activity ${activityId}`);
                  continue;
                }
                
                // ✅ แปลงวันที่จาก Excel format
                let registerDate: Date;
                try {
                  if (typeof data.timestamp === 'number') {
                    // Excel date format (45847.51810958333)
                    const millisecondsPerDay = 24 * 60 * 60 * 1000;
                    const excelEpoch = new Date(1900, 0, 1);
                    registerDate = new Date(excelEpoch.getTime() + (data.timestamp - 1) * millisecondsPerDay);
                  } else {
                    // String format
                    registerDate = new Date(data.timestamp);
                  }
                  
                  // ตรวจสอบว่าวันที่ถูกต้อง
                  if (isNaN(registerDate.getTime())) {
                    console.warn(`⚠️ Invalid date format for student ${data.studentId}: ${data.timestamp}`);
                    continue;
                  }
                } catch (dateError) {
                  console.warn(`⚠️ Failed to parse date for student ${data.studentId}: ${data.timestamp}`, dateError);
                  continue;
                }
                
                // ✅ สร้าง activity_detail (ไม่ระบุ activity_food_id ให้ใช้ DEFAULT)
                const activityDetailResult = await this.dataSource!.query(
                  `INSERT INTO activity_detail (activity_id, register_date, status) 
                   VALUES ($1, $2, 'Registered') 
                   RETURNING activity_detail_id`,
                  [activityId, registerDate]
                );
                
                if (activityDetailResult.length === 0) {
                  console.error(`❌ Failed to create activity_detail for student ${data.studentId}`);
                  continue;
                }
                
                const activityDetailId = activityDetailResult[0].activity_detail_id;
                
                // ✅ สร้าง join record
                await this.dataSource!.query(
                  `INSERT INTO "join" (students_id, activity_detail_id, join_date, status) 
                   VALUES ($1, $2, $3, 'Pending')`,
                  [studentId, activityDetailId, registerDate]
                );
                
                // ✅ อัพเดท registered_count ในตาราง activity
                await this.dataSource!.query(
                  `UPDATE activity 
                   SET registered_count = COALESCE(registered_count, 0) + 1 
                   WHERE activity_id = $1`,
                  [activityId]
                );
                
                enrolledCount++;
                console.log(`✅ Enrolled student ${data.studentId} (${data.name}) in activity ${activityId} on ${registerDate.toLocaleDateString('th-TH')}`);
                
              } catch (studentError) {
                console.error(`❌ Error enrolling student ${data.studentId}:`, studentError);
              }
            }
            
            console.log(`✅ Completed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(enrollmentData.length/batchSize)}`);
            
            // ✅ รอเล็กน้อยระหว่าง batch เพื่อให้ database พัก
            if (i + batchSize < enrollmentData.length) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
          } catch (batchError) {
            console.error(`❌ Batch processing error for batch ${Math.floor(i/batchSize) + 1}:`, batchError);
          }
        }
        
      console.log(`✅ Bulk enrollment completed. Successfully enrolled ${enrolledCount}/${enrollmentData.length} students`);
      return { enrolledCount };
        
    } catch (error) {
      this.logDbError("bulkEnrollStudents", error);
      throw new Error(`Failed to bulk enroll students: ${error}`);
    }
  }
}
