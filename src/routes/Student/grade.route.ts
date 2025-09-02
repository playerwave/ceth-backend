// src/routes/grade.route.ts

import { Router } from "express";
import { GradeController } from "../../controllers/Student/grade.controller";
import { validateDTO } from "../../middleware/validateDTO.validator";
import { CreateGradeDto, UpdateGradeDto } from "../../dtos/Student/grade.dto";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();
const gradeController = new GradeController();

// ✅ GET All Grades
router.get("/get-grades", verifyToken, (req, res) => gradeController.getAll(req, res));

// ✅ GET Grade Count
router.get("/count-grades", verifyToken, (req, res) => gradeController.count(req, res));

// ✅ POST Create Grade
router.post(
  "/create-grade",
  verifyToken,
  validateDTO(CreateGradeDto),
  (req, res) => gradeController.create(req, res)
);

// ✅ GET Grade by ID
router.get(
  "/get-grade/:grade_id",
  verifyToken,
  (req, res) => gradeController.getById(req, res)
);

// ✅ PUT Update Grade
router.put(
  "/update-grade/:grade_id",
  verifyToken,
  validateDTO(UpdateGradeDto),
  (req, res) => gradeController.update(req, res)
);

// ✅ DELETE Grade
router.delete(
  "/delete-grade/:grade_id",
  verifyToken,
  (req, res) => gradeController.delete(req, res)
);

export default router;
