import { Router } from "express";
import { TeacherStudentController } from "../../controllers/Teacher/teacherStudent.controller";
import upload from "../../middleware/multer";

const router = Router();
const controller = new TeacherStudentController();

router.post(
  "/upload",
  upload.single("file"), 
  controller.uploadStudents.bind(controller)
);

// Get All Users
router.get("/users", controller.getAllUsers.bind(controller));

// Reset All Students
router.delete("/reset", controller.resetAllStudents.bind(controller));

// Bulk Enroll Activity
router.post(
  "/bulk-enroll/:activity_id",
  upload.single("file"),
  controller.bulkEnrollActivity.bind(controller)
);

export default router;
