import { Router } from "express";
import { FacultyController } from "../controllers/faculty.controller";
import { wrapAsync } from "../utils/wrapAsync";
import { Admin } from "../middleware/CheckRole";

const router = Router();
const facultyController = new FacultyController();

// GET: รวมข้อมูลคณะทั้งหมด + จำนวนนับ
router.get("/data", Admin, wrapAsync(facultyController.getAll));

// POST: เพิ่มชื่อคณะ
router.post("/add", Admin, wrapAsync(facultyController.create));

// PUT: แก้ไขชื่อคณะ
router.put("/edit/:faculty_id", Admin, wrapAsync(facultyController.update));

// DELETE: ลบคณะ
router.delete(
  "/delete/:faculty_id",
  Admin,
  wrapAsync(facultyController.delete)
);

export default router;
