// import { Router } from "express";
// import { TeacherController } from "../../controllers/Teacher/teacher.controller";
// import { FacultyController } from "../../controllers/faculty.controller";
// import { Admin } from "../../middleware/CheckRole";
// import { wrapAsync } from "../../utils/wrapAsync";

// const router = Router();

// const teacherController = new TeacherController();
// const facultyController = new FacultyController();

// // GET: ดึงข้อมูลอาจารย์ทั้งหมด + คณะ
// router.get(
//   "/data",
//   wrapAsync(async (req, res) => {
//     const getTeacher = await teacherController.getAll(req, res);
//     const countTeacher = await teacherController.count(req, res);
//     const getFaculty = await facultyController.getAll(req, res);
//     const users = req.user;

//     if (req.isAuthenticated()) {
//       res.status(200).json({
//         page: "อาจารย์",
//         user: users,
//         teacherData: getTeacher,
//         countTeacher,
//         facultyData: getFaculty,
//         notification: "The data connection was successful.",
//       });
//     } else {
//       res.status(401).json({
//         page: "อาจารย์",
//         user: null,
//         notification: "Error fetching Teacher data",
//       });
//     }
//   })
// );

// // GET: ดึงเฉพาะอาจารย์ที่ลงทะเบียนสำเร็จ
// router.get(
//   "/success",
//   wrapAsync(async (req, res) => {
//     const getTeacher = await teacherController.getTeacherSuccess(req, res);
//     const countTeacher = await teacherController.count(req, res);
//     const getFaculty = await facultyController.getAll(req, res);
//     const users = req.user;

//     if (req.isAuthenticated()) {
//       res.status(200).json({
//         page: "อาจารย์",
//         user: users,
//         teacherData: getTeacher,
//         countTeacher,
//         facultyData: getFaculty,
//         notification: "The data connection was successful.",
//       });
//     } else {
//       res.status(401).json({
//         page: "อาจารย์",
//         user: null,
//         notification: "Error fetching Teacher data",
//       });
//     }
//   })
// );

// // PUT: อัปเดตข้อมูลอาจารย์
// router.put(
//   "/edit/:teacher_id",
//   Admin,
//   wrapAsync((req, res) => teacherController.update(req, res))
// );

// // DELETE: ลบอาจารย์
// router.delete(
//   "/delete/:teacher_id",
//   Admin,
//   wrapAsync((req, res) => teacherController.delete(req, res))
// );

// export default router;

// src/routes/Teacher/teacher.route.ts

import { Router, Request, Response } from "express";
import { TeacherDao } from "../../daos/Teacher/teacher.dao";
import { TeacherService } from "../../services/Teacher/teacher.service";
import { TeacherController } from "../../controllers/Teacher/teacher.controller";

import { FacultyService } from "../../services/faculty.service";
import { Admin } from "../../middleware/CheckRole";
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();

// 🧩 Dependency Injection
const teacherDao = new TeacherDao();
const teacherService = new TeacherService(teacherDao);
const teacherController = new TeacherController(teacherService);

const facultyService = new FacultyService();

// ✅ GET: All Teacher Data + Faculty
router.get(
  "/get-teachers",
  wrapAsync(async (req: Request, res: Response) => {
    const users = req.user;

    const teacherData = await teacherService.getTeacher();
    const countTeacher = await teacherService.countTeacher();
    const facultyData = await facultyService.getFaculty(1, 100);

    if (req.isAuthenticated()) {
      res.status(200).json({
        page: "อาจารย์",
        user: users,
        teacherData,
        countTeacher,
        facultyData,
        notification: "The data connection was successful.",
      });
    } else {
      res.status(401).json({
        page: "อาจารย์",
        user: null,
        notification: "Error fetching Teacher data",
      });
    }
  })
);

// ✅ GET: Teacher Success Only
router.get(
  "/success",
  Admin,
  wrapAsync(teacherController.getTeacherSuccess.bind(teacherController))
);

// ✅ PUT: Update Teacher
router.put(
  "/update-teacher/:teacher_id",
  Admin,
  wrapAsync(teacherController.update.bind(teacherController))
);

// ✅ DELETE: Delete Teacher
router.delete(
  "/delete-teacher/:teacher_id",
  Admin,
  wrapAsync(teacherController.delete.bind(teacherController))
);

export default router;
