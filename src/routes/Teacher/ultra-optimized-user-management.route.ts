import { Router } from "express";
import { ultraOptimizedUserManagementController } from "../../controllers/Teacher/ultra-optimized-user-management.controller";
import upload from "../../middleware/multer";
import { verifyToken } from "../../middleware/verifyToken";
import { CheckRole } from "../../middleware/CheckRole";
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();

// ================= Ultra Optimized Student Upload Routes =================

/**
 * @route POST /api/teacher/ultra-optimized/upload-students
 * @desc Upload students using ultra-optimized algorithm (O(n) with O(1) queries)
 * @access Private (Teacher only)
 * @performance Expected: 1476 students in < 60 seconds
 */
router.post(
  "/upload-students",
  verifyToken,
  CheckRole(["Teacher"]),
  upload.single("file"),
  wrapAsync(ultraOptimizedUserManagementController.ultraOptimizedUploadStudents)
);

/**
 * @route GET /api/teacher/ultra-optimized/performance-metrics
 * @desc Get performance metrics and optimization details
 * @access Private (Teacher only)
 */
router.get(
  "/performance-metrics",
  verifyToken,
  CheckRole(["Teacher"]),
  wrapAsync(ultraOptimizedUserManagementController.getPerformanceMetrics)
);

/**
 * @route DELETE /api/teacher/ultra-optimized/reset
 * @desc Reset all students using ULTRA-FAST algorithm (8 queries total)
 * @access Private (Teacher only)
 * @performance Expected: 5000 students in < 3 seconds
 */
router.delete(
  "/reset",
  verifyToken,
  CheckRole(["Teacher"]),
  wrapAsync(ultraOptimizedUserManagementController.ultraFastResetStudents)
);

/**
 * @route GET /api/teacher/ultra-optimized/reset-metrics
 * @desc Get reset performance metrics and optimization details
 * @access Private (Teacher only)
 */
router.get(
  "/reset-metrics",
  verifyToken,
  CheckRole(["Teacher"]),
  wrapAsync(ultraOptimizedUserManagementController.getResetPerformanceMetrics)
);

export default router;
