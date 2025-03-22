import { Activity } from "../../entity/Activity";
import { Assessment } from "../../entity/Assessment";
import { ActivityDao } from "../../daos/Admin/activity.dao";
import { AssessmentDao } from "../../daos/Admin/assessment.dao";
import { sendMailCreateActivity } from "../../mailer/email";
import logger from "../../middleware/logger";
import dayjs from "dayjs";
import { v2 as cloudinary } from "cloudinary";

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

      // ตรวจสอบ assessment_id และดึงข้อมูล Assessment
      if (activityData.assessment_id) {
        if (isNaN(Number(activityData.assessment_id))) {
          throw new Error("Invalid assessment_id format");
        }

        selectedAssessment =
          (await this.assessmentDao.getAssessmentByIdDao(
            activityData.assessment_id
          )) ?? null;
      }

      console.log(
        "🔍 ac_recieve_hours ก่อนคำนวณ:",
        activityData.ac_recieve_hours
      );

      // แปลงค่าเป็น Date ก่อนคำนวณ
      // กำหนดค่าให้ ac_recieve_hours เมื่อ ac_status เป็น Public และ ac_location_type คือ Onsite หรือ Online
      if (
        activityData.ac_status === "Public" &&
        (activityData.ac_location_type === "Onsite" ||
          activityData.ac_location_type === "Online") &&
        activityData.ac_start_time &&
        activityData.ac_end_time
      ) {
        const startTime = dayjs(activityData.ac_start_time);
        const endTime = dayjs(activityData.ac_end_time);

        activityData.ac_recieve_hours = endTime.hour() - startTime.hour();

        console.log(
          "✅ คำนวณ ac_recieve_hours:",
          activityData.ac_recieve_hours
        );
      }

      // กำหนด วันเปิดลงทะเบียนเมื่อ ac_status เป็น Public และส่ง Email แจ้งเตือนไปหานิสิต
      if (activityData.ac_status === "Public") {
        //บันทึกวันที่เริ่มลงทะเบียน
        activityData.ac_start_register = new Date();

        // ส่งเมลไปหานิสิตที่มีสถานะความเสี่ยงเป็น risk
        sendMailCreateActivity(
          "65160169@go.buu.ac.th",
          "createActivity",
          "ทดสอบส่งอีเมล"
        );

        console.log("send email success!");
      }

      // ✅ สร้างกิจกรรมใหม่
      const convertToDate = (value: any) =>
        typeof value === "string" ? new Date(value) : value;

      const newActivity = await this.activityDao.createActivityDao({
        ...activityData,
        assessment_id: selectedAssessment,
        ac_create_date: new Date(),
        ac_last_update: new Date(),
      });

      logger.info("✅ Activity created successfully", { newActivity });

      return newActivity;
    } catch (error) {
      logger.error("❌ Error in createActivityService(Admin)", error);
      throw error;
    }
  }

  // ✅ อัปเดตกิจกรรม
  async updateActivityService(
    activityId: number,
    activityData: Partial<Activity>
  ): Promise<Activity | null> {
    try {
      const id = activityId;
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

      if (activityData.ac_image_url) {
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
      logger.error("❌ Error in updateActivityService(Admin)", { error });
      throw error;
    }
  }

  // ✅ ลบกิจกรรม
  async deleteActivityService(activityId: number): Promise<boolean> {
    try {
      const id = activityId;
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
      logger.error("❌ Error in deleteActivityService(Admin)", { error });
      throw error;
    }
  }

  // ✅ ดึงรายการกิจกรรมทั้งหมด (รองรับ Pagination)
  async getAllActivitiesService(): Promise<Activity[]> {
    try {
      // ✅ ดึงข้อมูลจาก DAO
      const activities = await this.activityDao.getAllActivitiesDao();

      logger.info("✅ Fetched all activities", {
        total: activities.length,
      });

      return activities;
    } catch (error) {
      logger.error("❌ Error in getAllActivitiesService(Admin)", { error });
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

  // ✅ ค้นหากิจกรรม
  async searchActivityService(ac_name: string): Promise<Activity[]> {
    try {
      const activities = await this.activityDao.searchActivityDao(ac_name);
      logger.info("✅ Fetched activities by search", {
        ac_name,
        count: activities.length,
      });

      return activities;
    } catch (error) {
      logger.error("❌ Error in searchActivity(Admin)", { error });
      throw error;
    }
  }

  // ✅ ปรับสถานะกิจกรรม
  async adjustStatusActivityService(
    ac_id: string,
    ac_status: string
  ): Promise<Activity | null> {
    try {
      const id = parseInt(ac_id, 10);
      if (isNaN(id)) {
        throw new Error("Invalid activity ID format");
      }

      const updatedActivity = await this.activityDao.adjustStatusActivityDao(
        id,
        ac_status
      );
      logger.info("✅ Activity status updated", { ac_id: id, ac_status });

      return updatedActivity;
    } catch (error) {
      logger.error("❌ Error in adjustStatusActivity(Admin)", { error });
      throw error;
    }
  }

  async getEnrolledStudentsListService(activityId: number): Promise<any[]> {
    try {
      logger.info(
        `📡 Fetching enrolled students for activity ID: ${activityId}`
      );
      return await this.activityDao.getEnrolledStudentsListDao(activityId);
    } catch (error) {
      logger.error("❌ Error in getEnrolledStudentsListService", { error });
      throw error;
    }
  }
}
