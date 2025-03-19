import { Request, Response } from 'express';
import { ActivityService } from '../../services/Student/activity.service';
import logger from '../../middleware/logger';

export class ActivityController {
  constructor(private activityService: ActivityService) { }

  async getAllActivitiesController(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;

      const activities =
        await this.activityService.getAllActivitiesService(userId);
      res.status(200).json(activities);
    } catch (error) {
      logger.error('❌ Error in getAllActivitiesController(Admin)', { error });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async adviceActivities(req: Request, res: Response): Promise<Response> {
    const { u_id } = req.params;
    if (!u_id) {
      return res.status(400).send('You sent an invalid request.');
    }
    try {
      const result = await this.activityService.adviceActivities(Number(u_id));
      if (result.length > 0) {
        return res.status(200).json(result);
      } else {
        return res.status(404).send('No activities found.');
      }
    } catch (error) {
      console.log(`Error From adviceActivities Service: ${error}`);
      return res.status(500).send(`Error: ${error}`);
    }
  }

  async calculateRiskActivities(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const { u_id } = req.params;
    if (!u_id) {
      return res.status(400).send('You sent an invalid request.');
    }
    try {
      const result = await this.activityService.calculateRiskActivities(Number(u_id));
      if (result.length > 0) {
        return res.status(200).json(result);
      } else {
        return res.status(404).send('No activities found.');
      }
    } catch (error) {
      console.log(`Error From calculateRiskActivities Service: ${error}`);
      return res.status(500).send(`Error: ${error}`);
    }
  }
}

const activityService = new ActivityService();
export const activityController = new ActivityController(activityService);
