// src/routes/grade.route.ts

import { Router } from "express";
import { gradeController } from "../../controllers/Student/grade.controller.newstructure";
import { wrapAsync } from "../../utils/wrapAsync";
import { validateDTO } from "../../middleware/validateDTO.validator";
import { CreateGradeDto, UpdateGradeDto } from "../../dtos/Student/grade.dto";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();

// ✅ GET All Grades
router.get("/get-grades", verifyToken, wrapAsync(gradeController.getAll));

// ✅ GET Grade Count
router.get("/count-grades", verifyToken, wrapAsync(gradeController.count));

// ✅ POST Create Grade
router.post(
  "/create-grade",
  verifyToken,
  validateDTO(CreateGradeDto),
  wrapAsync(gradeController.create)
);

// ✅ GET Grade by ID
router.get(
  "/get-grade/:grade_id",
  verifyToken,
  wrapAsync(gradeController.getById)
);

// ✅ PUT Update Grade
router.put(
  "/update-grade/:grade_id",
  verifyToken,
  validateDTO(UpdateGradeDto),
  wrapAsync(gradeController.update)
);

// ✅ DELETE Grade
router.delete(
  "/delete-grade/:grade_id",
  verifyToken,
  wrapAsync(gradeController.delete)
);

export default router;
