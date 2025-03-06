import { Request, Response } from "express";
import { ActivityService } from "../../services/Admin/activity.service";

export class ActivityController {
  private activityService = new ActivityService();

  getAllActivities = async (req: Request, res: Response): Promise<Response> => {
    try {
      const activities = await this.activityService.getAllActivities();
      return res.status(200).json(activities);
    } catch (error) {
      console.error("❌ Error in getAllActivities:", error); // ✅ Log the error
      return res.status(500).json({ message: "Internal server error", error });
    }
  };

  getActivityById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }
      const activity = await this.activityService.getActivityById(id);
      return activity
        ? res.status(200).json(activity)
        : res.status(404).json({ message: "Activity not found" });
    } catch (error) {
      console.error("❌ Error in getActivityById:", error); // ✅ Log the error
      return res.status(500).json({ message: "Internal server error", error });
    }
  };
}
