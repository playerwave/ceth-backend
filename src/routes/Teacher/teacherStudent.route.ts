import { Router } from "express";
import { teacherStudentController } from "../../controllers/Teacher/teacherStudent.controller";
import upload from "../../middleware/multer";
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();

router.post(
  "/upload",
  upload.single("file"), 
  wrapAsync(teacherStudentController.uploadStudents)
);

// Get All Users
router.get("/users", wrapAsync(teacherStudentController.getAllUsers));

// Reset All Students
router.delete("/reset", wrapAsync(teacherStudentController.resetAllStudents));


// เพิ่ม route สำหรับ reset time_in และ time_out ของนักเรียน
router.patch("/reset-student-times/:activityId", wrapAsync(teacherStudentController.resetStudentTimes));

// Bulk Check-In Activity
router.post(
  "/bulk-checkin/:activity_id",
  upload.single("file"),
  wrapAsync(teacherStudentController.bulkCheckIn)
);

// Bulk Check-Out Activity
router.post(
  "/bulk-checkout/:activity_id",
  upload.single("file"),
  wrapAsync(teacherStudentController.bulkCheckOut)
);

// Bulk Enroll Activity
router.post(
  "/bulk-enroll/:activity_id",
  upload.single("file"),
  wrapAsync(teacherStudentController.bulkEnrollActivity)
);

// Export Students to Excel
router.get(
  "/export-students",
  wrapAsync(teacherStudentController.exportStudentsToExcel)
);

export default router;
