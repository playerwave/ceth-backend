import { connectDatabase } from "../../db/database";
import { Students } from "../../entity/students.entity";
import { getRepository } from "typeorm";

export class TeacherStudentDao {
  // ✅ insertStudents แบบ loop ป้องกัน error
  public async insertStudents(students: Partial<Students>[]): Promise<void> {
    const connection = await connectDatabase();
    const studentRepo = connection.getRepository(Students);

    for (const s of students) {
      try {
        await studentRepo.save(s); // ✅ จะ insert/update ให้เอง
      } catch (err) {
        console.error("❌ Insert student error", err);
      }
    }
  }

  // ✅ ดึง Users ทั้งหมด
  public async getAllUsers(): Promise<Students[]> {
    const connection = await connectDatabase();
    const studentRepo = connection.getRepository(Students);

    return studentRepo.find(); // SELECT * FROM students
  }
}
