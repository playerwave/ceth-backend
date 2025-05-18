import { Router } from "express";
import { ActivityController } from "../controllers/activity.controller";  
const router = Router();
const controller = new ActivityController();

// GET: ดึงกิจกรรมทั้งหมด
router.get("/", (req, res) => controller.getAllActivitiesController(req, res));

// GET: ดึงกิจกรรมตาม ID
router.get("/:id", (req, res) => controller.getActivityByIdController(req, res));

// POST: สร้างกิจกรรมใหม่
router.post("/", (req, res) => controller.createActivityController(req, res));

// PUT: อัปเดตกิจกรรมตาม ID
router.put("/:id", (req, res) => controller.updateActivityController(req, res));

// DELETE: ลบกิจกรรมตาม ID
router.delete("/:id", (req, res) => controller.deleteActivityController(req, res));

// GET: ค้นหากิจกรรมตามชื่อ
router.get("/search", (req, res) => controller.searchActivityController(req, res));

// GET: ดึงรายชื่อนิสิตที่ลงทะเบียนในกิจกรรม
router.get("/:id/enrolled-students", (req, res) =>
  controller.getEnrolledStudentsListController(req, res)
);

export default router;
