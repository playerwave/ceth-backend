import { Assessment } from '../../entity/Assessment';
import { AssessmentDao } from '../../daos/Admin/assessment.dao';
import logger from '../../middleware/logger';

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

      logger.info('✅ Fetched all activities', {
        total,
      });

      return { assessments, total };
    } catch (error) {
      logger.error('❌ Error in getAllAssessmentsService(Admin)', { error });
      throw error;
    }
  }
}

// async getAllActivitiesService(userId: number): Promise<Activity[]> {
//   try {
//     // ดึงข้อมูลกิจกรรมจาก DAO โดยกรองแค่กิจกรรมที่ผู้ใช้ยังไม่ได้ลงทะเบียน
//     const activities = await this.activityDao.getAllActivitiesDao(userId);

//     logger.info(
//       "✅ Fetched all public activities that user has not registered for",
//       {
//         total: activities.length,
//       }
//     );

//     return activities;
//   } catch (error) {
//     logger.error("❌ Error in getAllActivitiesService(Admin)", { error });
//     throw error;
//   }
// }

// async adviceActivities(u_id: number): Promise<Activity[]> {
//   return await this.activityDao.adviceActivities(u_id);
// }
