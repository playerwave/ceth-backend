import { Request, Response } from 'express';
import { ActivityService } from '../services/activity.service';
import logger from '../middleware/logger';

export class ActivityController {
  private activityService = new ActivityService();

  // สร้างกิจกรรมใหม่
  async createActivityController(req: Request, res: Response): Promise<void> {
    try {
      // แปลง id เป็น number
      let imageUrl = req.body.ac_image_url || '';

      const activityData = {
        ...req.body,
        ac_image_url: imageUrl,
        ac_not_attended_count: req.body.ac_not_attended_count
          ? !isNaN(Number(req.body.ac_not_attended_count))
            ? parseInt(req.body.ac_not_attended_count, 10)
            : 0
          : 0,
        ac_type: req.body.ac_type || 'Soft Skill',
      };

      const activity = await this.activityService.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      logger.error('❌ Error in createActivityController(Admin)', { error });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // อัปเดตกิจกรรม
  async updateActivityController(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid activity ID' });
        return;
      }

      const activity = await this.activityService.updateActivity(id, req.body);

      if (!activity) {
        res.status(404).json({ error: 'Activity not found' });
        return;
      }

      logger.info('✅ Activity updated successfully', { activity });
      res.status(200).json(activity);
    } catch (error) {
      logger.error('❌ Error in updateActivityController(Admin)', { error });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // ลบกิจกรรม
  async deleteActivityController(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid activity ID' });
        return;
      }

      const deleted = await this.activityService.deleteActivity(id);

      if (!deleted) {
        res.status(404).json({ error: 'Activity not found' });
        return;
      }

      logger.info('✅ Activity deleted successfully', { id });
      res.status(200).json({ message: 'Activity deleted successfully' });
    } catch (error) {
      logger.error('❌ Error in deleteActivityController(Admin)', { error });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // ดึงกิจกรรมทั้งหมด
  async getAllActivitiesController(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const activities = await this.activityService.getAllActivities(limit, offset);
      res.status(200).json(activities);
    } catch (error) {
      logger.error('❌ Error in getAllActivitiesController(Admin)', { error });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // ดึงกิจกรรมตาม ID
  async getActivityByIdController(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid activity ID' });
        return;
      }

      const activity = await this.activityService.getActivityById(id);
      if (!activity) {
        res.status(404).json({ error: 'Activity not found' });
        return;
      }

      res.status(200).json(activity);
    } catch (error) {
      logger.error('❌ Error in getActivityByIdController(Admin)', { error });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // ค้นหากิจกรรม
  async searchActivityController(req: Request, res: Response): Promise<void> {
    try {
      const ac_name = req.query.ac_name as string;

      if (!ac_name) {
        res.status(400).json({ error: "Missing 'ac_name' parameter" });
        return;
      }

      const activities = await this.activityService.searchActivityService(ac_name);

      if (activities.length === 0) {
        res.status(404).json({ message: 'No activities found' });
        return;
      }

      res.status(200).json(activities);
    } catch (error) {
      logger.error("❌ Error in searchActivityController(Admin)", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // ดึงรายชื่อนิสิตที่ลงทะเบียนในกิจกรรม
  async getEnrolledStudentsListController(req: Request, res: Response): Promise<void> {
    try {
      const activityId = parseInt(req.params.id, 10);
      if (isNaN(activityId)) {
        res.status(400).json({ error: "Invalid activity ID" });
        return;
      }

      const students = await this.activityService.getEnrolledStudentsListService(activityId);
      res.status(200).json({ activityId, students });
    } catch (error) {
      logger.error("❌ Error in getEnrolledStudentsListController", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
