// src/routes/department.route.ts
import { Router } from "express";
import { DepartmentService } from "../services/department.service";
import { DepartmentController } from "../controllers/department.controller";
import { DepartmentDao } from "../daos/department.dao";
import { FacultyService } from "../services/faculty.service";
import { FacultyDao } from "../daos/faculty.dao";
import { wrapAsync } from "../utils/wrapAsync";
import { validateDTO } from "../middleware/validateDTO.validator";
import { verifyToken } from "../middleware/verifyToken";
import { Admin } from "../middleware/CheckRole";

const router = Router();

// ✅ สร้าง instance ของ service และ controller
const departmentDao = new DepartmentDao();
const departmentService = new DepartmentService(departmentDao);
const departmentController = new DepartmentController(departmentService);
const facultyDao = new FacultyDao();
const facultyService = new FacultyService(facultyDao);

// 🧠 interface สำหรับ JWT user
interface JwtUser {
  users_id: number;
  roles_id: number;
}

// ✅ GET /get-departments → รวมข้อมูลสาขา + faculty + user
router.get(
  "/get-departments",
  verifyToken,
  wrapAsync(async (req, res) => {
    const user = req.user as JwtUser;
    const departmentData = await departmentService.getDepartment(1, 100);
    const countDepartment = await departmentService.countDepartment();
    const facultyData = await facultyService.getFaculty(1, 100);

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      page: "สาขา",
      user,
      departmentData,
      countDepartment,
      facultyData,
      notification: "เชื่อมต่อข้อมูลสาขาสำเร็จ",
    });
  })
);

// ✅ GET /count → จำนวนสาขาทั้งหมด
router.get("/count", verifyToken, wrapAsync(departmentController.count));

// ✅ POST /create-department → เพิ่มสาขา
router.post(
  "/create-department",
  verifyToken,
  wrapAsync(departmentController.create.bind(departmentController))
);

// ✅ PUT /update-department/:department_id → แก้ไขสาขา
router.put(
  "/update-department/:department_id",
  verifyToken,
  wrapAsync(departmentController.update.bind(departmentController))
);

// ✅ DELETE /delete-department/:department_id → ลบสาขา
router.delete(
  "/delete-department/:department_id",
  verifyToken,
  wrapAsync(departmentController.delete.bind(departmentController))
);

export default router;
