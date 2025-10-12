import { Router } from "express";
import { userManagementController } from "../../controllers/Teacher/user-management.controller";
import { verifyToken } from "../../middleware/verifyToken";
import { CheckRole } from "../../middleware/CheckRole";
import upload from "../../middleware/multer";
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();

// Get all students
router.get(
  "/students",
  verifyToken,
  CheckRole(["Teacher"]),
  wrapAsync(userManagementController.getAllStudents)
);

// Get students by department short name
router.get(
  "/students/:departmentCode",
  verifyToken,
  CheckRole(["Teacher"]),
  wrapAsync(userManagementController.getStudentsByDepartment)
);

// Get all departments
router.get(
  "/departments",
  verifyToken,
  CheckRole(["Teacher"]),
  wrapAsync(userManagementController.getAllDepartments)
);

// Upload students
router.post(
  "/upload",
  upload.single("file"), 
  wrapAsync(userManagementController.uploadStudents)
);

// Review upload data
router.post(
  "/review-upload",
  upload.single("file"),
  verifyToken,
  CheckRole(["Teacher"]),
  wrapAsync(userManagementController.reviewUploadData)
);

// Update grade year
router.post(
  "/update-grade-year",
  verifyToken,
  CheckRole(["Teacher"]),
  wrapAsync(userManagementController.updateGradeYear)
);

// Rollback grade year
router.post(
  "/rollback-grade-year",
  verifyToken,
  CheckRole(["Teacher"]),
  wrapAsync(userManagementController.rollbackGradeYear)
);

export default router;
