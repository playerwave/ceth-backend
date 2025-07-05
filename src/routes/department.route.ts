// src/routes/department.route.ts

import { Router } from "express";
import { departmentController } from "../controllers/department.controller";
import { facultyController } from "../controllers/faculty.controller";
import { Admin } from "../middleware/CheckRole";
import { wrapAsync } from "../utils/wrapAsync";

const router = Router();

// GET: สาขาทั้งหมด + จำนวน + คณะที่เกี่ยวข้อง
router.get(
  "/data",
  Admin,
  wrapAsync(async (req, res) => {
    const user = req.user;

    const [departments, count, faculties] = await Promise.all([
      departmentController.getAll(req, res),
      departmentController.count(req, res),
      facultyController.getAll(req, res),
    ]);

    if (req.isAuthenticated()) {
      res.status(200).json({
        page: "สาขา",
        user,
        departmentData: departments,
        countDepartment: count,
        facultyData: faculties,
        notification: "The data connection was successful.",
      });
    } else {
      res.status(401).json({
        page: "สาขา",
        user: null,
        notification: "Error fetching Department data",
      });
    }
  })
);

// POST: เพิ่มสาขา
router.post("/add", Admin, wrapAsync(departmentController.create));

// PUT: แก้ไขชื่อสาขา
router.put(
  "/edit/:department_id",
  Admin,
  wrapAsync(departmentController.update)
);

// DELETE: ลบสาขา
router.delete(
  "/delete/:department_id",
  Admin,
  wrapAsync(departmentController.delete)
);

export default router;
