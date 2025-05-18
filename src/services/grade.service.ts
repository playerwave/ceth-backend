import { GradeDao } from "../daos/Admin/grade.dao";
import { Grade } from "../interfaces/Grade";

export class GradeService {
  private gradeDao = new GradeDao();

  async getAllGrades(): Promise<Grade[]> {
    return this.gradeDao.getAllGrades();
  }

  async getGradeById(id: number): Promise<Grade | null> {
    return this.gradeDao.getGradeById(id);
  }
}
