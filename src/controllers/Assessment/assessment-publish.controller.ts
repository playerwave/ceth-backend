import { Request, Response } from "express";
import { ErrorHandledController } from "../error.handled.controller";
import { AssessmentPublishService } from "../../services/Assessment/assessment-publish.service";

export class AssessmentPublishController extends ErrorHandledController {
  private readonly assessmentPublishService = new AssessmentPublishService();

  /**
   * Publish assessment
   */
  public async publishAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      
      if (!assessmentId || isNaN(Number(assessmentId))) {
        res.status(400).json({ message: "Invalid assessment ID" });
        return;
      }

      const publishedVersion = await this.assessmentPublishService.publishAssessmentVersion(Number(assessmentId));
      
      res.status(200).json({
        message: "Assessment published successfully",
        version: publishedVersion
      });
    } catch (error) {
      this.handleError("AssessmentPublishController.publishAssessment", error, res);
    }
  }

  /**
   * ตรวจสอบว่า assessment พร้อม publish หรือไม่
   */
  public async validateForPublishing(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      
      if (!assessmentId || isNaN(Number(assessmentId))) {
        res.status(400).json({ message: "Invalid assessment ID" });
        return;
      }

      const validation = await this.assessmentPublishService.validateAssessmentForPublishing(Number(assessmentId));
      
      res.status(200).json({
        message: "Assessment validation completed",
        validation
      });
    } catch (error) {
      this.handleError("AssessmentPublishController.validateForPublishing", error, res);
    }
  }
}
