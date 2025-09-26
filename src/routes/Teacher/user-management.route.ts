import { Router } from "express";
import { userManagementController } from "../../controllers/Teacher/user-management.controller";
import { verifyToken } from "../../middleware/verifyToken";
import { CheckRole } from "../../middleware/CheckRole";
import upload from "../../middleware/multer";
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();

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

export default router;
