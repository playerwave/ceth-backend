// import { Router } from "express";
// import { FacultyController } from "../controllers/faculty.controller";
// import { wrapAsync } from "../utils/wrapAsync";
// import { Admin } from "../middleware/CheckRole";

// const router = Router();
// const facultyController = new FacultyController();

// // GET: รวมข้อมูลคณะทั้งหมด + จำนวนนับ
// router.get("/data", Admin, wrapAsync(facultyController.getAll));

// // POST: เพิ่มชื่อคณะ
// router.post("/add", Admin, wrapAsync(facultyController.create));

// // PUT: แก้ไขชื่อคณะ
// router.put("/edit/:faculty_id", Admin, wrapAsync(facultyController.update));

// // DELETE: ลบคณะ
// router.delete(
//   "/delete/:faculty_id",
//   Admin,
//   wrapAsync(facultyController.delete)
// );

// export default router;

// src/routes/faculty.route.ts
import { Router, Request, Response } from "express";
import { FacultyController } from "../controllers/faculty.controller";
import { FacultyService } from "../services/faculty.service";
import { FacultyDao } from "../daos/faculty.dao";
import { wrapAsync } from "../utils/wrapAsync";
import { Admin } from "../middleware/CheckRole";
import { validateDTO } from "../middleware/validateDTO.validator";
import { CreateFacultyDto } from "../dtos/faculty/create-faculty.dto";
import { UpdateFacultyDto } from "../dtos/faculty/update-faculty.dto";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

// 🔧 สร้าง instance
const facultyDao = new FacultyDao();
const facultyService = new FacultyService(facultyDao);
const facultyController = new FacultyController(facultyService);

// GET METHOD: Get faculty data with count
router.get(
  "/get-faculties",
  verifyToken,
  wrapAsync(async (req: Request, res: Response) => {
    const user = req.user;

    const facultyData = await facultyService.getFaculty(1, 100);
    const countFaculty = await facultyService.countFaculty();

    res.setHeader("Cache-Control", "no-store");

    res.status(200).json({
      page: "คณะ",
      user,
      facultyData,
      countFaculty,
      notification: "เชื่อมต่อข้อมูลคณะสำเร็จ",
    });
  })
);

// POST METHOD: Create faculty
router.post(
  "/create-faculty",
  verifyToken,
  validateDTO(CreateFacultyDto),
  wrapAsync(facultyController.create.bind(facultyController))
);

// PUT METHOD: Update faculty
router.put(
  "/update-faculty/:faculty_id",
  verifyToken,
  validateDTO(UpdateFacultyDto),
  wrapAsync(facultyController.update.bind(facultyController))
);

// DELETE METHOD: Delete faculty
router.delete(
  "/delete-faculty/:faculty_id",
  verifyToken,
  wrapAsync(facultyController.delete.bind(facultyController))
);

export default router;
