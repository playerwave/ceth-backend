import { Router, Request, Response } from "express";
import { AssessmentController } from "../../controllers/TestCloud/assessment.controller";

const router = Router();
const assessmentController = new AssessmentController();

router.get("/", async (req: Request, res: Response) => {
  await assessmentController.getAssessment(req, res);
});

export default router;
