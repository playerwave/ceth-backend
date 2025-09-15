import { Router } from "express";
import { AssessmentPublishController } from "../../../controllers/Assessment/assessment-publish.controller";

const router = Router();
const assessmentPublishController = new AssessmentPublishController();

// Publish assessment
router.post("/:assessmentId/publish", assessmentPublishController.publishAssessment.bind(assessmentPublishController));

// ตรวจสอบว่า assessment พร้อม publish หรือไม่
router.get("/:assessmentId/validate-publish", assessmentPublishController.validateForPublishing.bind(assessmentPublishController));

export default router;
