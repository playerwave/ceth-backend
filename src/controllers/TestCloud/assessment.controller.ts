import { Request, Response } from "express";
import { AssessmentService } from "../../services/TestCloud/assessment.service";

export class AssessmentController {
  private assessmentService = new AssessmentService();

  // ฟังก์ชันสำหรับแสดงรายชื่อผู้ใช้
  getAssessment = async (req: Request, res: Response) => {
    try {
      const assessments = await this.assessmentService.getAssessment();
      return res.render("assessment.ejs", {
        assessment: assessments,
      });
    } catch (error) {
      res.status(500).send("Error to Response");
    }
  };
}
