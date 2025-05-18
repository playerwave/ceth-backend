import { StudentsDao } from "../daos/Admin/students.dao";
import { Students } from "../interfaces/Students";

export class StudentsService {
  private studentsDao = new StudentsDao();

  async getAllStudents(): Promise<Students[]> {
    return this.studentsDao.getAllStudents();
  }

  async getStudentById(id: number): Promise<Students | null> {
    return this.studentsDao.getStudentById(id);
  }
}
    