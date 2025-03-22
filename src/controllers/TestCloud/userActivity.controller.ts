import { Request, Response } from "express";
import { UserActivityService } from "../../services/TestCloud/userActivity.service";

export class UserActivityController {
  private userActivityService = new UserActivityService();

  // ฟังก์ชันสำหรับแสดงรายชื่อผู้ใช้
  getUserActivity = async (req: Request, res: Response) => {
    try {
      const userActivitys = await this.userActivityService.getUserActivity();
      return res.render("userActivity.ejs", {
        userActivity: userActivitys,
      });
    } catch (error) {
      res.status(500).send("Error to Response");
    }
  };
}
