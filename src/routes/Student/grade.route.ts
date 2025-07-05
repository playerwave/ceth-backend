// src/routes/grade.route.ts

import { Router } from "express";
import { gradeController } from "../../controllers/Student/grade.controller"; // ✅ Singleton export
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();

// ✅ GET All Grades
router.get("/get-grades", wrapAsync(gradeController.getAll));

// ✅ GET Grade Count
router.get("/count-grades", wrapAsync(gradeController.count));

export default router;
