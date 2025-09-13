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

export default router;
