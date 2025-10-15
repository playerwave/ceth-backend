import { Router } from "express";
import { ActivityReportController } from "../../controllers/Teacher/activity-report.controller";
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();
const activityReportController = new ActivityReportController();

// GET /api/teacher/activity-report/:activityId/enrollment-by-department
// ดึงข้อมูลจำนวนนิสิตที่ลงทะเบียนแยกตามสาขาและชั้นปี
router.get(
  "/:activityId/enrollment-by-department",
  wrapAsync(activityReportController.getEnrollmentByDepartment)
);

// GET /api/teacher/activity-report/:activityId/participation-status
// ดึงข้อมูลสถานะการเข้าร่วมกิจกรรมและสถานะนิสิต
router.get(
  "/:activityId/participation-status",
  wrapAsync(activityReportController.getParticipationStatus)
);

// GET /api/teacher/activity-report/:activityId/assessment-data
// ดึงข้อมูลแบบประเมินและผลการตอบ
router.get(
  "/:activityId/assessment-data",
  wrapAsync(activityReportController.getAssessmentData)
);

// GET /api/teacher/activity-report/:activityId/satisfaction-survey
// ดึงข้อมูลแบบประเมินความพึงพอใจ
router.get(
  "/:activityId/satisfaction-survey",
  wrapAsync(activityReportController.getSatisfactionSurvey)
);

// GET /api/teacher/activity-report/:activityId/student-assessment-status
// ดึงข้อมูลสถานะการทำแบบประเมินของนิสิต
router.get(
  "/:activityId/student-assessment-status",
  wrapAsync(activityReportController.getStudentAssessmentStatus)
);

// GET /api/teacher/activity-report/:activityId/debug-answers
// Debug endpoint สำหรับตรวจสอบข้อมูลคำตอบ
router.get(
  "/:activityId/debug-answers",
  wrapAsync(activityReportController.debugAnswers)
);

export default router;
