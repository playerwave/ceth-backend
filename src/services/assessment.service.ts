import { AssessmentDao } from "../daos/Admin/assessment.dao";
import { Assessment } from "../interfaces/Assessment";

export class AssessmentService {
  private assessmentDao = new AssessmentDao();

  async getAllAssessments(): Promise<Assessment[]> {
    return this.assessmentDao.getAllAssessments();
  }

  async getAssessmentById(id: number): Promise<Assessment | null> {
    return this.assessmentDao.getAssessmentById(id);
  }
}
