import { Activity } from "../../entity/Activity";
import { Assessment } from "../../entity/Assesment";
import { ActivityDao } from "../../daos/Admin/activity.dao";
import { AssessmentDao } from "../../daos/Admin/assesment.dao";
import { sendMailCreateActivity } from "../../mailer/email";
import logger from "../../middleware/logger";

export class ActivityService {
  private activityDao = new ActivityDao();
  private assessmentDao = new AssessmentDao();

  // ✅ สร้างกิจกรรมใหม่
  async createActivityService(
    activityData: Partial<Activity> & { assessment_id?: number }
  ): Promise<Activity> {
    try {
      logger.info("📩 Received data in createActivityService", {
        activityData,
      });

      let selectedAssessment: Assessment | null = null;

      // ✅ ตรวจสอบ assessment_id และดึงข้อมูล Assessment
      if (activityData.assessment_id) {
        if (isNaN(Number(activityData.assessment_id))) {
          throw new Error("Invalid assessment_id format");
        }

        selectedAssessment =
          (await this.assessmentDao.getAssessmentById(
            activityData.assessment_id
          )) ?? null;
      }

      // ✅ สร้างกิจกรรมใหม่
      const newActivity = await this.activityDao.createActivityDao({
        ...activityData,
        assessment: selectedAssessment,
        ac_create_date: new Date(),
        ac_last_update: new Date(),
      });

      logger.info("✅ Activity created successfully", { newActivity });

      return newActivity;
    } catch (error) {
      logger.error("❌ Error in createActivityService", { error });
      throw error;
    }
  }

  // ✅ อัปเดตกิจกรรม
  async updateActivityService(
    activityId: string,
    activityData: Partial<Activity>
  ): Promise<Activity | null> {
    try {
      const id = parseInt(activityId, 10);
      if (isNaN(id)) {
        throw new Error("Invalid activity ID format");
      }

      logger.info("📩 Received data in updateActivityService", {
        activityId: id,
        activityData,
      });

      const existingActivity = await this.activityDao.getActivityByIdDao(id);
      if (!existingActivity) {
        logger.warn("⚠️ Activity not found", { activityId: id });
        return null;
      }

      if (activityData.ac_image_data) {
        logger.info("📸 New image detected, updating image...");
      }

      // ✅ อัปเดต Activity
      const updatedActivity = await this.activityDao.updateActivityDao(id, {
        ...activityData,
        ac_last_update: new Date(),
      });

      logger.info("✅ Activity updated successfully", {
        activityId: id,
        updatedActivity,
      });
      return updatedActivity;
    } catch (error) {
      logger.error("❌ Error in updateActivityService", { error });
      throw error;
    }
  }

  // ✅ ลบกิจกรรม
  async deleteActivityService(activityId: string): Promise<boolean> {
    try {
      const id = parseInt(activityId, 10);
      if (isNaN(id)) {
        throw new Error("Invalid activity ID format");
      }

      logger.info("📩 Received request to delete activity", { activityId: id });

      const existingActivity = await this.activityDao.getActivityByIdDao(id);
      if (!existingActivity) {
        logger.warn("⚠️ Activity not found", { activityId: id });
        return false;
      }

      await this.activityDao.deleteActivityDao(id);
      logger.info("✅ Activity deleted successfully", { activityId: id });

      return true;
    } catch (error) {
      logger.error("❌ Error in deleteActivityService", { error });
      throw error;
    }
  }

  // ✅ ดึงรายการกิจกรรมทั้งหมด (รองรับ Pagination)
  async getAllActivitiesService(
    page: number,
    limit: number
  ): Promise<{ activities: Activity[]; total: number; totalPages: number }> {
    try {
      // ✅ คำนวณค่า offset
      const offset = (page - 1) * limit;

      // ✅ ดึงข้อมูลจาก DAO
      const [activities, total] = await this.activityDao.getAllActivities(
        offset,
        limit
      );

      // ✅ คำนวณจำนวนหน้าทั้งหมด
      const totalPages = Math.ceil(total / limit);

      logger.info("✅ Fetched all activities", {
        page,
        limit,
        total,
        totalPages,
      });

      return { activities, total, totalPages };
    } catch (error) {
      logger.error("❌ Error in getAllActivitiesService", { error });
      throw error;
    }
  }

  // ✅ ดึงกิจกรรมตาม ID
  async getActivityByIdService(activityId: string): Promise<Activity | null> {
    try {
      const id = parseInt(activityId, 10);
      if (isNaN(id)) {
        throw new Error("Invalid activity ID format");
      }

      const activity = await this.activityDao.getActivityByIdDao(id);
      return activity;
    } catch (error) {
      logger.error("❌ Error in getActivityByIdService", { error });
      throw error;
    }
  }

  // ✅ ค้นหากิจกรรม
  async searchActivity(ac_name: string): Promise<Activity[]> {
    try {
      const activities = await this.activityDao.searchActivity(ac_name);
      logger.info("✅ Fetched activities by search", {
        ac_name,
        count: activities.length,
      });

      return activities;
    } catch (error) {
      logger.error("❌ Error in searchActivity", { error });
      throw error;
    }
  }

  // ✅ ปรับสถานะกิจกรรม
  async adjustStatusActivity(
    ac_id: string,
    ac_status: string
  ): Promise<Activity | null> {
    try {
      const id = parseInt(ac_id, 10);
      if (isNaN(id)) {
        throw new Error("Invalid activity ID format");
      }

      const updatedActivity = await this.activityDao.adjustStatusActivity(
        id,
        ac_status
      );
      logger.info("✅ Activity status updated", { ac_id: id, ac_status });

      return updatedActivity;
    } catch (error) {
      logger.error("❌ Error in adjustStatusActivity", { error });
      throw error;
    }
  }
}
