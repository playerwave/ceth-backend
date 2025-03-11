import { Request, Response } from "express";
import { ActivityService } from "../../services/Admin/activity.service";
import logger from "../../middleware/logger";

export class ActivityController {
  constructor(private activityService: ActivityService) {}

  // ✅ สร้างกิจกรรมใหม่
  async createActivityController(req: Request, res: Response): Promise<void> {
    try {
      const activityData = req.body;

      // ✅ ตรวจสอบ assessment_id ก่อนส่งให้ Service
      if (
        activityData.assessment_id &&
        isNaN(Number(activityData.assessment_id))
      ) {
        res.status(400).json({ error: "Invalid assessment_id" });
        return;
      }

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
