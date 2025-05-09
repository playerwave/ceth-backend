import { Assessment } from "../../entity/Assessment";
import { AssessmentDao } from "../../daos/Admin/assessment.dao";
import logger from "../../utils/logger";

export class AssessmentService {
  private assessmentDao = new AssessmentDao();

  async getAllAssessmentsService(): Promise<{
    assessments: Assessment[];
    total: number;
  }> {
    try {
      // ✅ ดึงข้อมูลทั้งหมดจาก DAO
      const [assessments, total] =
        await this.assessmentDao.getAllAssessmentsDao();

      logger.info("✅ Fetched all activities", {
        total,
      });

      return { assessments, total };
    } catch (error) {
      logger.error("❌ Error in getAllAssessmentsService(Admin)", { error });
      throw error;
    }
  }
}
