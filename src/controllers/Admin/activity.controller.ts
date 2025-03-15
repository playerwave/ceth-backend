import { Request, Response } from "express";
import { ActivityService } from "../../services/Admin/activity.service";
import logger from "../../middleware/logger";

export class ActivityController {
  constructor(private activityService: ActivityService) {}

  async createActivityController(req: Request, res: Response): Promise<void> {
    try {
      let imageUrl = req.body.ac_image_url || ""; // ✅ ใช้ค่าที่ได้มาหรือกำหนดค่าเริ่มต้น
      const activityData = {
        ...req.body,
        ac_image_url: imageUrl,

        // ✅ ตรวจสอบค่าตัวเลข ห้ามเป็น ""
        assessment_id: req.body.assessment_id
          ? !isNaN(Number(req.body.assessment_id))
            ? parseInt(req.body.assessment_id, 10)
            : null
          : null,

        ac_seat: req.body.ac_seat
          ? !isNaN(Number(req.body.ac_seat))
            ? parseInt(req.body.ac_seat, 10)
            : null
          : null,

        ac_registered_count: req.body.ac_registered_count
          ? !isNaN(Number(req.body.ac_registered_count))
            ? parseInt(req.body.ac_registered_count, 10)
            : 0
          : 0,

        ac_attended_count: req.body.ac_attended_count
          ? !isNaN(Number(req.body.ac_attended_count))
            ? parseInt(req.body.ac_attended_count, 10)
            : 0
          : 0,

        ac_not_attended_count: req.body.ac_not_attended_count
          ? !isNaN(Number(req.body.ac_not_attended_count))
            ? parseInt(req.body.ac_not_attended_count, 10)
            : 0
          : 0,

        ac_start_register: req.body.ac_start_register || null,
        ac_end_register: req.body.ac_end_register || null,
        ac_start_time: req.body.ac_start_time || null,
        ac_end_time: req.body.ac_end_time || null,
        ac_normal_register: req.body.ac_normal_register || null,
        ac_start_assessment: req.body.ac_start_assessment || null,
        ac_end_assessment: req.body.ac_end_assessment || null,
      };

      const activity = await this.activityService.createActivityService(
        activityData
      );
      res.status(201).json(activity);
    } catch (error) {
      logger.error("❌ Error in createActivityController(Admin)", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // ✅ อัปเดตกิจกรรม
  async updateActivityController(req: Request, res: Response): Promise<void> {
    try {
      const activity = await this.activityService.updateActivityService(
        req.params.id,
        req.body
      );
      if (!activity) {
        res.status(404).json({ error: "Activity not found" });
        return;
      }

      logger.info("✅ Activity updated successfully", { activity });
      res.status(200).json(activity);
    } catch (error) {
      logger.error("❌ Error in updateActivityController(Admin)", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // ✅ ลบกิจกรรม
  async deleteActivityController(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await this.activityService.deleteActivityService(
        req.params.id
      );
      if (!deleted) {
        res.status(404).json({ error: "Activity not found" });
        return;
      }

      logger.info("✅ Activity deleted successfully", { id: req.params.id });
      res.status(200).json({ message: "Activity deleted successfully" });
    } catch (error) {
      logger.error("❌ Error in deleteActivityController(Admin)", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // ✅ ดึงรายการกิจกรรมทั้งหมด (รองรับ Pagination)
  async getAllActivitiesController(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const activities = await this.activityService.getAllActivitiesService(
        page,
        limit
      );

      res.status(200).json(activities);
    } catch (error) {
      logger.error("❌ Error in getAllActivitiesController(Admin)", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // ✅ ดึงกิจกรรมตาม ID
  async getActivityByIdController(req: Request, res: Response): Promise<void> {
    try {
      const activity = await this.activityService.getActivityByIdService(
        req.params.id
      );
      if (!activity) {
        res.status(404).json({ error: "Activity not found" });
        return;
      }

      res.status(200).json(activity);
    } catch (error) {
      logger.error("❌ Error in getActivityByIdController(Admin)", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // ✅ ค้นหากิจกรรม
  async searchActivityController(req: Request, res: Response): Promise<void> {
    try {
      const { ac_name } = req.query;
      if (!ac_name) {
        res.status(400).json({ error: "Missing 'ac_name' parameter" });
        return;
      }

      const activities = await this.activityService.searchActivityService(
        ac_name as string
      );
      if (activities.length === 0) {
        res.status(404).json({ message: "No activities found" });
        return;
      }

      res.status(200).json(activities);
    } catch (error) {
      logger.error("❌ Error in searchActivityController(Admin)", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

// ✅ สร้าง Instance ของ Controller
const activityService = new ActivityService();
export const activityController = new ActivityController(activityService);
