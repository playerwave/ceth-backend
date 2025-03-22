import { Request, Response } from "express";
import { ActivityService } from "../../services/TestCloud/activity.service";

export class ActivityController {
  private activityService = new ActivityService();

  // ฟังก์ชันสำหรับแสดงรายชื่อผู้ใช้
  getActivity = async (req: Request, res: Response) => {
    try {
      const activitys = await this.activityService.getActivity();
      return res.render("activity.ejs", {
        activity: activitys,
      });
    } catch (error) {
      res.status(500).send("Error to Response");
    }
  };
}
