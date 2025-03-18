import { Request, Response } from "express";
import { ActivityService } from "../../services/Student/activity.service";
import logger from "../../middleware/logger";

export class ActivityController {
  constructor(private activityService: ActivityService) {}

  async getAllActivitiesController(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;

      const activities = await this.activityService.getAllActivitiesService(
        userId
      );
      res.status(200).json(activities);
    } catch (error) {
      logger.error("❌ Error in getAllActivitiesController(Admin)", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

const activityService = new ActivityService();
export const activityController = new ActivityController(activityService);
