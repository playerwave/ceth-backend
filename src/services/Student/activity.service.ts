import { Activity } from "../../entity/Activity";
import { ActivityDao } from "../../daos/Student/activity.dao";
import logger from "../../middleware/logger";
import dayjs from "dayjs";

export class ActivityService {
  private activityDao = new ActivityDao();

  async getStudentActivitiesService(userId: number): Promise<Activity[]> {
    try {
      // ดึงข้อมูลกิจกรรมจาก DAO โดยกรองแค่กิจกรรมที่ผู้ใช้ยังไม่ได้ลงทะเบียน
      const activities = await this.activityDao.getStudentActivitiesDao(userId);

      logger.info(
        "✅ Fetched all public activities that user has not registered for",
        {
          total: activities.length,
        }
      );

      return activities;
    } catch (error) {
      logger.error("❌ Error in getAllActivitiesService(Admin)", { error });
      throw error;
    }
  }

  async studentEnrollActivityService(
    userId: number,
    activityId: number
  ): Promise<void> {
    await this.activityDao.studentEnrollActivityDao(userId, activityId);
  }
}
