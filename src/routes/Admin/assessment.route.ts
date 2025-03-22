import { Router } from "express";
import { assessmentController } from "../../controllers/Admin/assessment.controller";

const router = Router();

router.get("/get-assessments", (req, res, next) =>
  assessmentController.getAllAssessmentsController(req, res).catch(next),
);

export default router;
