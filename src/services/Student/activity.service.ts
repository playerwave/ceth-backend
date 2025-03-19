import { Activity } from "../../entity/Activity";
import { ActivityDao } from "../../daos/Student/activity.dao";
import logger from "../../middleware/logger";
import dayjs from "dayjs";

export class ActivityService {
  private activityDao = new ActivityDao();

  async getAllActivitiesService(userId: number): Promise<Activity[]> {
    try {
      // ดึงข้อมูลกิจกรรมจาก DAO โดยกรองแค่กิจกรรมที่ผู้ใช้ยังไม่ได้ลงทะเบียน
      const activities = await this.activityDao.getAllActivitiesDao(userId);

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

  async fetchEnrolledActivities(u_id: number): Promise<Activity[]> {
    return await this.activityDao.fetchEnrolledActivities(u_id);
  }
}
