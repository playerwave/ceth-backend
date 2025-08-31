import * as XLSX from "xlsx";
import { TeacherStudentDao } from "../../daos/Teacher/teacherStudent.dao";
import { Students } from "../../entity/students.entity";
import { ErrorHandledService } from "../error.handdled.service";

export class TeacherStudentService extends ErrorHandledService {
  private readonly studentDao = new TeacherStudentDao();

  public async uploadStudents(filePath: string): Promise<{ message: string }> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

      const students: Partial<Students>[] = data.map((row) => ({
        first_name_tha: row["name"] ?? null,
        first_name_eng: row["engName"] ?? null,
        users_id: row["code"] ?? null,
        department_id: row["major"] ?? null,
        soft_hours: row["softSkill"] ?? null,
        hard_hours: row["hardSkill"] ?? null,
        status: "Active",
      }));

      await this.studentDao.insertStudents(students);

      this.logInfo("✅ Uploaded students", { count: students.length });

      return { message: `Uploaded ${students.length} students` };
    } catch (error) {
      this.logError("❌ Error in uploadStudents", error);
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
