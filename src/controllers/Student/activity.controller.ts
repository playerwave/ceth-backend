import { Request, Response } from "express";
import { ActivityService } from "../../services/Student/activity.service";
import logger from "../../middleware/logger";

export class ActivityController {
  constructor(private activityService: ActivityService) { }

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

  async fetchEnrolledActivities(req: Request, res: Response): Promise<Response> {
    const { u_id } = req.params;
    if (!u_id) {
        return res.status(400).json({ error: "Invalid user ID." });
    }
    try {
        const result = await this.activityService.fetchEnrolledActivities(Number(u_id));
        
        console.log("✅ Data to be sent:", JSON.stringify(result, null, 2));

        return res.status(200)
            .header("Cache-Control", "no-store")  // ✅ ปิด Cache
            .json(result);
    } catch (error) {
        console.error(`❌ Error in fetchEnrolledActivities: ${error}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async getSkillStats(req: Request, res: Response): Promise<Response> {
  console.log("📌 API /skillStats/:id ถูกเรียก"); // ✅ Debug

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Invalid student ID" });
  }

  try {
      console.log(`🔍 Fetching skill stats for student ID: ${id}`); // ✅ Debug
      const stats = await this.activityService.getSkillStats(Number(id));

      if (!stats) {
          return res.status(404).json({ error: "No data found for this student" });
      }
      
      console.log("✅ Skill Stats Data:", stats); // ✅ Debug
      return res.status(200).json(stats);
  } catch (error) {
      console.error(`❌ Error fetching skill stats: ${error}`);
      return res.status(500).json({ error: "Failed to fetch skill stats" });
  }
}





}

const activityService = new ActivityService();
export const activityController = new ActivityController(activityService);
