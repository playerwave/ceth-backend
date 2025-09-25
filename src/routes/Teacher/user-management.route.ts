import { Router } from "express";
import { UserManagementController } from "../../controllers/Teacher/user-management.controller";
import { verifyToken } from "../../middleware/verifyToken";
import { CheckRole } from "../../middleware/CheckRole";

const router = Router();
const userManagementController = new UserManagementController();

// Get students by department short name
router.get(
  "/students/:departmentCode",
  verifyToken,
  CheckRole(["Teacher"]),
  userManagementController.getStudentsByDepartment.bind(userManagementController)
);

// Get all departments
router.get(
  "/departments",
  verifyToken,
  CheckRole(["Teacher"]),
  userManagementController.getAllDepartments.bind(userManagementController)
);

export default router;
