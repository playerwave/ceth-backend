import { Request, Response } from "express";
import { ActivityAssessmentService } from "../../services/TestCloud/activityAssessment.service";

export class ActivityAssessmentController {
  private activityAssessmentService = new ActivityAssessmentService();

  // ฟังก์ชันสำหรับแสดงรายชื่อผู้ใช้
  getActivityAssessment = async (req: Request, res: Response) => {
    try {
      const activityAssessments =
        await this.activityAssessmentService.getActivityAssessment();
      return res.render("activityAssessment.ejs", {
        activityAssessment: activityAssessments,
      });
    } catch (error) {
      res.status(500).send("Error to Response");
    }
  };
}
