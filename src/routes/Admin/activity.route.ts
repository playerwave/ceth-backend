// import express
import {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

// import controller
// import { activityController } from "../../controllers/Admin/activity.controller";

// import controller เพื่อทดสอบโครงสร้างใหม่
import { activityController } from "../../controllers/Admin/activity.controller.newstructure";

// import validate function & middleware
import { validateDTO } from "../../middleware/validateDTO";
import { requestValidator } from "../../middleware/requestValidator";
import upload from "../../middleware/multer";

// import utils
import { wrapAsync } from "../../utils/wrapAsync";

// import DTO
import {
  CreateActivityDto,
  UpdateActivityDto,
} from "../../dtos/Admin/activity.dto";

const router = Router();

// POST METHOD
router.post(
  "/create-activity",
  upload.single("ac_image_url"), // ✅ เพิ่ม Multer Middleware สำหรับอัปโหลดไฟล์
  validateDTO(CreateActivityDto),
  wrapAsync(activityController.create)
);

// PUT METHOD
router.put(
  "/update-activity/:id",
  validateDTO(UpdateActivityDto),
  wrapAsync(activityController.update)
);

// DELETE METHOD
router.delete("/delete-activity/:id", wrapAsync(activityController.delete));

// GET METHOD

// เรียกดู activity ทั้งแบบที่เป็น Public และ Private และยังไม่ถึงเวลาปิดให้ทำแบบประเมิน
// แต่เอาจริงน่าจะเปลี่ยนเป็นอะไรสักอย่างที่สื่อความหมายมากกว่านี้
router.get("/get-activities", wrapAsync(activityController.getAll));

// เรียกดูรายกิจกรรม
router.get("/get-activity/:id", wrapAsync(activityController.getById));

// ค้นหากิจกรรมตามชื่อ บริษัท/วิทยากร หรือ ชื่อกิจกรรม
router.get("/searchActivity", wrapAsync(activityController.search));

// เรียกดูนิสิตที่ enroll เข้ามาในแต่ละกิจกรรม
// เรียก controller ผิดตัวเดี๋ยวมาแก้ละกัน
router.get(
  "/get-enrolled-studentslist/:id",
  wrapAsync(activityController.getEnrolledStudents)
);

export default router;
