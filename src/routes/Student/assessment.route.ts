import { Router } from "express";
import { AssessmentController } from "../../controllers/Student/assessment.controller";
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();
const assessmentController = new AssessmentController();

// POST /api/student/assessment/submit - ส่งคำตอบ assessment
router.post("/submit", wrapAsync(assessmentController.submitAssessment));

// GET /api/student/assessment/:assessmentId - ดึงข้อมูล assessment
router.get("/:assessmentId", wrapAsync(assessmentController.getAssessment));

// GET /api/student/activity/:activityId/assessment - ดึงข้อมูล assessment ตาม activity
router.get("/activity/:activityId/assessment", wrapAsync(assessmentController.getAssessmentByActivityId));

export default router;
