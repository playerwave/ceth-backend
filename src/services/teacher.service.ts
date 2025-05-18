import { TeacherDao } from "../daos/Admin/teacher.dao";
import { Teacher } from "../interfaces/Teacher";

export class TeacherService {
  private teacherDao = new TeacherDao();

  async getAllTeachers(): Promise<Teacher[]> {
    return this.teacherDao.getAllTeachers();
  }

  async getTeacherById(id: number): Promise<Teacher | null> {
    return this.teacherDao.getTeacherById(id);
  }
}
