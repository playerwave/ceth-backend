import { AssessmentService } from "../../services/Admin/assessment.service";
import { Request, Response } from "express";
import logger from "../../utils/logger";

export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  async getAllAssessmentsController(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const assessments =
        await this.assessmentService.getAllAssessmentsService();

      res.status(200).json(assessments);
    } catch (error) {
      logger.error("❌ Error in getAllAssessmentsController(Admin)", { error });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

const assessmentService = new AssessmentService();
export const assessmentController = new AssessmentController(assessmentService);
