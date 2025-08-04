// import express
import {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

// import controller เพื่อทดสอบโครงสร้างใหม่
import { teacherController } from "../../controllers/Teacher/teacher.controller";

// import validate function & middleware
import { validateDTO } from "../../middleware/validateDTO.validator";
import { requestValidator } from "../../middleware/requestValidator";

// import utils
import { wrapAsync } from "../../utils/wrapAsync";

// import services
import { TeacherDao } from "../../daos/Teacher/teacher.dao";
import { TeacherService } from "../../services/Teacher/teacher.service";
import { FacultyService } from "../../services/faculty.service";

const router = Router();

// 🧩 Dependency Injection
const teacherDao = new TeacherDao();
const teacherService = new TeacherService(teacherDao);
const facultyService = new FacultyService();

// GET METHOD
router.get("/get-teachers", wrapAsync(teacherController.getAll));

router.get(
  "/get-teacher/:teacher_id",
  wrapAsync(teacherController.getPaginated)
);

// PUT METHOD
router.put("/update-teacher/:teacher_id", wrapAsync(teacherController.update));

// DELETE METHOD
router.delete(
  "/delete-teacher/:teacher_id",
  wrapAsync(teacherController.delete)
);

export default router;
