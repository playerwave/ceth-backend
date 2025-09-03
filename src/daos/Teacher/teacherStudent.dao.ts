import { connectDatabase } from "../../db/database";
import { Students } from "../../entity/students.entity";
import { Department } from "../../entity/department.entity";
import { getRepository } from "typeorm";

export class TeacherStudentDao {
  // ✅ แปลงชื่อย่อ department เป็น department_id
  private async convertDepartmentShortNameToId(connection: any, shortName: string): Promise<number | null> {
    try {
      const departmentRepo = connection.getRepository(Department);
      const department = await departmentRepo.findOne({
        where: { department_short_name: shortName }
      });
      
      if (department) {
        console.log(`✅ Found department: ${shortName} -> ID: ${department.department_id}`);
        return department.department_id;
      } else {
        console.warn(`⚠️ Department not found for short name: ${shortName}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error converting department short name ${shortName}:`, error);
      return null;
    }
  }

  // ✅ แปลงข้อมูลนักเรียนทั้งหมดให้มี department_id ที่ถูกต้อง
  private async convertStudentData(connection: any, students: Partial<Students>[]): Promise<Partial<Students>[]> {
    const convertedStudents: Partial<Students>[] = [];
    
    for (const student of students) {
      try {
        // ✅ ถ้ามี department_id เป็น string (ชื่อย่อ) ให้แปลงเป็น ID
        if (student.department_id && typeof student.department_id === 'string') {
          const departmentId = await this.convertDepartmentShortNameToId(connection, student.department_id);
          
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
      }
    }
    
    console.log(`✅ Converted ${convertedStudents.length}/${students.length} students successfully`);
    return convertedStudents;
  }

  // ✅ insertStudents แบบ loop ป้องกัน error + connection health check
  public async insertStudents(students: Partial<Students>[]): Promise<void> {
    let connection;
    let retries = 3;
    
    while (retries > 0) {
      try {
        connection = await connectDatabase();
        
        // ✅ ตรวจสอบ connection health
        if (!connection.isConnected) {
          console.log("🔄 Connection lost, reconnecting...");
          await connection.connect();
        }
        
        // ✅ แปลงข้อมูลนักเรียนก่อน insert
        console.log("🔄 Converting student data...");
        const convertedStudents = await this.convertStudentData(connection, students);
        
        if (convertedStudents.length === 0) {
          console.warn("⚠️ No valid students to insert after conversion");
          return;
        }
        
        const studentRepo = connection.getRepository(Students);
        console.log(`📊 Starting to insert ${convertedStudents.length} students...`);

        // ✅ ใช้ batch insert แทน loop เพื่อประสิทธิภาพ
        const batchSize = 50; // ลดจาก 100 เป็น 50 เพื่อความเสถียร
        for (let i = 0; i < convertedStudents.length; i += batchSize) {
          const batch = convertedStudents.slice(i, i + batchSize);
          
          try {
            // ✅ ตรวจสอบ connection health ก่อนแต่ละ batch
            if (!connection.isConnected) {
              console.log("🔄 Connection lost during batch processing, reconnecting...");
              await connection.connect();
            }
            
            await studentRepo.save(batch);
            console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(convertedStudents.length/batchSize)} (${batch.length} students)`);
            
            // ✅ รอเล็กน้อยระหว่าง batch เพื่อให้ database พัก
            if (i + batchSize < convertedStudents.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
          } catch (batchError) {
            console.error(`❌ Batch insert error for batch ${Math.floor(i/batchSize) + 1}:`, batchError);
            
            // ✅ ถ้า batch insert ไม่สำเร็จ ให้ insert ทีละตัว
            console.log("🔄 Falling back to individual inserts...");
            for (const student of batch) {
              try {
                // ✅ ตรวจสอบ connection health ก่อนแต่ละ insert
                if (!connection.isConnected) {
                  console.log("🔄 Connection lost during individual insert, reconnecting...");
                  await connection.connect();
                }
                
                await studentRepo.save(student);
              } catch (individualError) {
                console.error("❌ Individual insert student error:", individualError);
                console.error("❌ Student data:", student);
              }
            }
          }
        }

        console.log("✅ All students processed successfully");
        break; // ออกจาก retry loop
        
      } catch (error) {
        retries--;
        console.error(`❌ Database operation failed, retries left: ${retries}`, error);
        
        if (retries === 0) {
          throw new Error(`Failed to insert students after 3 attempts: ${error}`);
        }
        
        // รอ 2 วินาทีก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // ✅ ดึง Users ทั้งหมด
  public async getAllUsers(): Promise<Students[]> {
    let connection;
    let retries = 3;
    
    while (retries > 0) {
      try {
        connection = await connectDatabase();
        
        // ✅ ตรวจสอบ connection health
        if (!connection.isConnected) {
          console.log("🔄 Connection lost, reconnecting...");
          await connection.connect();
        }
        
        const studentRepo = connection.getRepository(Students);
        const users = await studentRepo.find();
        console.log(`✅ Fetched ${users.length} users successfully`);
        return users;
        
      } catch (error) {
        retries--;
        console.error(`❌ Failed to fetch users, retries left: ${retries}`, error);
        
        if (retries === 0) {
          throw new Error(`Failed to fetch users after 3 attempts: ${error}`);
        }
        
        // รอ 1 วินาทีก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error("Failed to fetch users");
  }

  // ✅ ดึง User โดย ID
  public async getUserById(id: number): Promise<Students | null> {
    let connection;
    let retries = 3;
    
    while (retries > 0) {
      try {
        connection = await connectDatabase();
        
        // ✅ ตรวจสอบ connection health
        if (!connection.isConnected) {
          console.log("🔄 Connection lost, reconnecting...");
          await connection.connect();
        }
        
        const studentRepo = connection.getRepository(Students);
        const user = await studentRepo.findOne({ where: { students_id: id } });
        
        if (user) {
          console.log(`✅ Found user with ID: ${id}`);
        } else {
          console.log(`⚠️ No user found with ID: ${id}`);
        }
        
        return user;
        
      } catch (error) {
        retries--;
        console.error(`❌ Failed to fetch user by ID ${id}, retries left: ${retries}`, error);
        
        if (retries === 0) {
          throw new Error(`Failed to fetch user by ID ${id} after 3 attempts: ${error}`);
        }
        
        // รอ 1 วินาทีก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error(`Failed to fetch user by ID ${id}`);
  }

  // ✅ อัพเดท User
  public async updateUser(id: number, updateData: Partial<Students>): Promise<Students | null> {
    let connection;
    let retries = 3;
    
    while (retries > 0) {
      try {
        connection = await connectDatabase();
        
        // ✅ ตรวจสอบ connection health
        if (!connection.isConnected) {
          console.log("🔄 Connection lost, reconnecting...");
          await connection.connect();
        }
        
        const studentRepo = connection.getRepository(Students);
        
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
        retries--;
        console.error(`❌ Failed to update user ${id}, retries left: ${retries}`, error);
        
        if (retries === 0) {
          throw new Error(`Failed to update user ${id} after 3 attempts: ${error}`);
        }
        
        // รอ 1 วินาทีก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error(`Failed to update user ${id}`);
  }

  // ✅ ลบ User
  public async deleteUser(id: number): Promise<boolean> {
    let connection;
    let retries = 3;
    
    while (retries > 0) {
      try {
        connection = await connectDatabase();
        
        // ✅ ตรวจสอบ connection health
        if (!connection.isConnected) {
          console.log("🔄 Connection lost, reconnecting...");
          await connection.connect();
        }
        
        const studentRepo = connection.getRepository(Students);
        
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
        retries--;
        console.error(`❌ Failed to delete user ${id}, retries left: ${retries}`, error);
        
        if (retries === 0) {
          throw new Error(`Failed to delete user ${id} after 3 attempts: ${error}`);
        }
        
        // รอ 1 วินาทีก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error(`Failed to delete user ${id}`);
  }

  // ✅ Reset ข้อมูลนิสิตทั้งหมดและ reset sequence
  public async resetAllStudents(): Promise<{ deletedCount: number }> {
    let connection;
    let retries = 3;
    
    while (retries > 0) {
      try {
        connection = await connectDatabase();
        
        // ✅ ตรวจสอบ connection health
        if (!connection.isConnected) {
          console.log("🔄 Connection lost, reconnecting...");
          await connection.connect();
        }
        
        console.log("🔄 Starting reset of all students...");
        
        // ✅ นับจำนวนนักเรียนก่อนลบ
        const studentRepo = connection.getRepository(Students);
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
          const joinResult = await connection.query('DELETE FROM "join" WHERE students_id IS NOT NULL');
          console.log(`✅ Deleted ${joinResult.length || 0} related join records`);
        } catch (error) {
          console.warn("⚠️ Could not delete join data:", error.message);
        }
        
        // ลบข้อมูลในตาราง certificate ที่อ้างอิง students
        try {
          const certResult = await connection.query('DELETE FROM certificate WHERE students_id IS NOT NULL');
          console.log(`✅ Deleted ${certResult.length || 0} related certificate records`);
        } catch (error) {
          console.warn("⚠️ Could not delete certificate data:", error.message);
        }
        
        // ลบข้อมูลในตาราง answer ที่อ้างอิง join (ถ้ามี)
        try {
          const answerResult = await connection.query('DELETE FROM answer WHERE join_id IN (SELECT join_id FROM "join" WHERE students_id IS NOT NULL)');
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
          await connection.query('ALTER SEQUENCE IF EXISTS students_students_id_seq RESTART WITH 1');
          console.log("✅ Reset student_id sequence to start from 1");
        } catch (seqError) {
          console.warn("⚠️ Could not reset sequence, but students were deleted successfully");
        }
        
        return { deletedCount };
        
      } catch (error) {
        retries--;
        console.error(`❌ Database operation failed, retries left: ${retries}`, error);
        
        if (retries === 0) {
          throw new Error(`Failed to reset students after 3 attempts: ${error}`);
        }
        
        // รอ 2 วินาทีก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error("Failed to reset students");
  }

  // ✅ ตรวจสอบว่ากิจกรรมมีอยู่จริง
  public async checkActivityExists(activityId: number): Promise<boolean> {
    let connection;
    let retries = 3;
    
    while (retries > 0) {
      try {
        connection = await connectDatabase();
        
        // ✅ ตรวจสอบ connection health
        if (!connection.isConnected) {
          console.log("🔄 Connection lost, reconnecting...");
          await connection.connect();
        }
        
        const result = await connection.query(
          'SELECT activity_id FROM activity WHERE activity_id = $1 AND status = \'Active\'',
          [activityId]
        );
        
        const exists = result.length > 0;
        console.log(`✅ Activity ${activityId} exists: ${exists}`);
        return exists;
        
      } catch (error) {
        retries--;
        console.error(`❌ Failed to check activity ${activityId}, retries left: ${retries}`, error);
        
        if (retries === 0) {
          throw new Error(`Failed to check activity ${activityId} after 3 attempts: ${error}`);
        }
        
        // รอ 1 วินาทีก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error(`Failed to check activity ${activityId}`);
  }

  // ✅ ลงทะเบียนนักเรียนหลายคนในกิจกรรม
  public async bulkEnrollStudents(
    activityId: number, 
    enrollmentData: Array<{ timestamp: string; studentId: string; name: string; department: string; email: string }>
  ): Promise<{ enrolledCount: number }> {
    let connection;
    let retries = 3;
    
    while (retries > 0) {
      try {
        connection = await connectDatabase();
        
        // ✅ ตรวจสอบ connection health
        if (!connection.isConnected) {
          console.log("🔄 Connection lost, reconnecting...");
          await connection.connect();
        }
        
        console.log(`🔄 Starting bulk enrollment for activity ${activityId} with ${enrollmentData.length} students`);
        
        let enrolledCount = 0;
        
        // ✅ ใช้ batch processing เพื่อความเสถียร
        const batchSize = 10; // ลด batch size เพื่อความเสถียร
        for (let i = 0; i < enrollmentData.length; i += batchSize) {
          const batch = enrollmentData.slice(i, i + batchSize);
          
          try {
            // ✅ ตรวจสอบ connection health ก่อนแต่ละ batch
            if (!connection.isConnected) {
              console.log("🔄 Connection lost during batch processing, reconnecting...");
              await connection.connect();
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
                const userResult = await connection.query(
                  'SELECT users_id FROM users WHERE username = $1',
                  [data.studentId]
                );
                
                if (userResult.length === 0) {
                  console.warn(`⚠️ User not found for student ID: ${data.studentId}`);
                  continue;
                }
                
                const userId = userResult[0].users_id;
                
                // ✅ หา student โดย users_id
                const studentResult = await connection.query(
                  'SELECT students_id FROM students WHERE users_id = $1',
                  [userId]
                );
                
                if (studentResult.length === 0) {
                  console.warn(`⚠️ Student not found for user ID: ${userId}`);
                  continue;
                }
                
                const studentId = studentResult[0].students_id;
                
                // ✅ ตรวจสอบว่าลงทะเบียนแล้วหรือไม่
                const existingEnrollment = await connection.query(
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
                const activityDetailResult = await connection.query(
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
                await connection.query(
                  `INSERT INTO "join" (students_id, activity_detail_id, join_date, status) 
                   VALUES ($1, $2, $3, 'Pending')`,
                  [studentId, activityDetailId, registerDate]
                );
                
                // ✅ อัพเดท registered_count ในตาราง activity
                await connection.query(
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
        retries--;
        console.error(`❌ Database operation failed, retries left: ${retries}`, error);
        
        if (retries === 0) {
          throw new Error(`Failed to bulk enroll students after 3 attempts: ${error}`);
        }
        
        // รอ 2 วินาทีก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error("Failed to bulk enroll students");
  }
}
