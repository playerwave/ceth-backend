import { Router, Request, Response } from "express";

// import controller
import { StudentsController } from "../../controllers/Student/students.controller";

// import service
import { FacultyService } from "../../services/faculty.service";
import { DepartmentService } from "../../services/department.service";
import { GradeService } from "../../services/Student/grade.service";
import { EventCoopService } from "../../services/Student/eventcoop.service";
import { StudentsService } from "../../services/Student/student.service";

// import dao
import { StudentsDao } from "../../daos/Student/student.dao";
import { UsersDao } from "../../daos/users.dao";

// import middleware
import { Admin } from "../../middleware/CheckRole";
import { wrapAsync } from "../../utils/wrapAsync";
import { validateDTO } from "../../middleware/validateDTO.validator";
import { CreateStudentDto } from "../../dtos/Teacher/student.dto";
import { UpdateStudentDto } from "../../dtos/Teacher/student.dto";
import { verifyToken } from "../../middleware/verifyToken";

const router = Router();

// ✅ Dependency Injection
const studentsDao = new StudentsDao();
const usersDao = new UsersDao();
const studentsService = new StudentsService(studentsDao, usersDao);
const studentsController = new StudentsController(studentsService);

const facultyService = new FacultyService();
const departmentService = new DepartmentService();
const gradeService = new GradeService();
const eventCoopService = new EventCoopService();

// ✅ GET all student data
router.get(
  "/get-students",
  verifyToken,
  wrapAsync(async (req: Request, res: Response) => {
    const user = req.user;

    const studentsData = await studentsService.getStudents();
    const countStudents = await studentsService.countStudents();

    const [facultyData, departmentData, gradeData, eventCoopData] =
      await Promise.all([
        facultyService.getFaculty(1, 100),
        departmentService.getDepartment(1, 100),
        gradeService.getGrade(),
        eventCoopService.getEventCoop(),
      ]);

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      page: "นิสิต",
      user,
      studentsData,
      countStudents,
      facultyData,
      departmentData,
      gradeData,
      eventCoopData,
      notification: "เชื่อมต่อข้อมูลนิสิตสำเร็จ",
    });
  })
);

// ✅ GET Success students (แยก endpoint admin)
router.get(
  "/success",
  verifyToken,
  wrapAsync(studentsController.getStudentsSuccess.bind(studentsController))
);

// ✅ POST: Create student
router.post(
  "/create-student",
  verifyToken,
  validateDTO(CreateStudentDto),
  wrapAsync(studentsController.create.bind(studentsController))
);

// ✅ PUT: Update student
router.put(
  "/update-student/:students_id",
  verifyToken,
  validateDTO(UpdateStudentDto),
  wrapAsync(studentsController.update.bind(studentsController))
);

// ✅ DELETE: Delete student
router.delete(
  "/delete-student/:students_id",
  verifyToken,
  wrapAsync(studentsController.delete.bind(studentsController))
);

export default router;
