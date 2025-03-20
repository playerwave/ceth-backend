import { Request, Response } from "express";
import { ActivityService } from "../../services/Student/activity.service";
import { UserActivity } from "../../entity/UserActivity";
import { Activity } from "../../entity/Activity";
import { getRepository } from "typeorm";
import logger from "../../middleware/logger";

export class ActivityController {
  constructor(private activityService: ActivityService) {}

  async getStudentActivitiesController(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { userId } = req.body;

      const activities = await this.activityService.getStudentActivitiesService(
        userId
      );
      res.status(200).json(activities);
    } catch (error) {
      logger.error("❌ Error in getAllActivitiesController(Admin)", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getActivityByIdController(req: Request, res: Response): Promise<void> {
    try {
      const activity = await this.activityService.getActivityByIdService(
        req.params.id
      );
      if (!activity) {
        res.status(404).json({ error: "Activity not found" });
        return;
      }
      console.log("🔍 Activity Response:", JSON.stringify(activity, null, 2));
      res.status(200).json(activity);
    } catch (error) {
      logger.error("❌ Error in getActivityByIdController(Admin)", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async studentEnrollActivityController(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      const activityId = parseInt(req.body.activityId, 10);

      if (isNaN(userId) || isNaN(activityId)) {
        throw new Error("Invalid user ID or activity ID.");
      }

      const activity = await this.activityService.studentEnrollActivityService(
        userId,
        activityId
      );

      console.log("User successfully registered for the activity.");
      res
        .status(200)
        .json({ message: "Registration successful", activity: activity });
    } catch (error) {
      console.error("Error registering user for activity:", error);
      res.status(500).json({ error: "Failed to register user for activity." });
    }
  }

  async getEnrolledActivitiesController(
    req: Request,
    res: Response
  ): Promise<Response> {
    const userId = parseInt(req.params.id, 10);
    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID." });
    }
    try {
      const result = await this.activityService.getEnrolledActivitiesService(
        userId
      );

      console.log("✅ Data to be sent:", JSON.stringify(result, null, 2));

      return res
        .status(200)
        .header("Cache-Control", "no-store") // ✅ ปิด Cache
        .json(result);
    } catch (error) {
      console.error(`❌ Error in fetchEnrolledActivities: ${error}`);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async unEnrollActivityController(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      const activityId = parseInt(req.body.activityId, 10);

      console.log(userId);

      if (isNaN(userId) || isNaN(activityId)) {
        res.status(400).json({ error: "Invalid userId or activityId" });
        return;
      }

      const success = await this.activityService.unEnrollActivityService(
        userId,
        activityId
      );
      if (success) {
        res
          .status(200)
          .json({ message: "Successfully unenrolled from activity" });
      } else {
        res.status(404).json({ error: "Activity registration not found" });
      }
    } catch (error) {
      console.error("❌ Error in unEnrollActivityController:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

const activityService = new ActivityService();
export const activityController = new ActivityController(activityService);
