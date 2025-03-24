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

  async getActivityByIdService(activityId: string): Promise<Activity | null> {
    try {
      const id = parseInt(activityId, 10);
      if (isNaN(id)) {
        throw new Error("Invalid activity ID format");
      }

      const activity = await this.activityDao.getActivityByIdDao(id);
      console.log(
        "📌 Activity Data from DAO:",
        JSON.stringify(activity, null, 2)
      );
      return activity;
    } catch (error) {
      logger.error("❌ Error in getActivityByIdService(Admin)", { error });
      throw error;
    }
  }

  async studentEnrollActivityService(
    userId: number,
    activityId: number
  ): Promise<void> {
    await this.activityDao.studentEnrollActivityDao(userId, activityId);
  }

  async getEnrolledActivitiesService(u_id: number): Promise<Activity[]> {
    return await this.activityDao.getEnrolledActivitiesDao(u_id);
  }

  async searchActivityService(ac_name: string): Promise<Activity[]> {
    try {
      const activities = await this.activityDao.searchActivityDao(ac_name);
      logger.info("✅ Fetched activities by search", {
        ac_name,
        count: activities.length,
      });

      return activities;
    } catch (error) {
      logger.error("❌ Error in searchActivity(Student)", { error });
      throw error;
    }
  }

  async unEnrollActivityService(
    userId: number,
    activityId: number
  ): Promise<boolean> {
    return await this.activityDao.unEnrollActivityDao(userId, activityId);
  }
}
