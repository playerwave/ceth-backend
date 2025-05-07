import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { activityController } from "../../controllers/Admin/activity.controller";
import { validateDTO } from "../../middleware/validateDTO";
import {
  CreateActivityDto,
  UpdateActivityDto,
} from "../../dtos/Admin/activity.dto";
import upload from "../../middleware/multer";

/*
/ ใช้ห่อ async controller เพื่อจับ error อัติโนมัติ
  ตามหลักการ DRY ที่พยายามไม่ใช้โค้ดที่ยาวๆซ้ำๆ
*/
export const wrapAsync = (
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const router = Router();

// POST METHOD
router.post(
  "/create-activity",
  upload.single("ac_image_url"), // ✅ เพิ่ม Multer Middleware สำหรับอัปโหลดไฟล์
  validateDTO(CreateActivityDto),
  wrapAsync(activityController.createActivityController),
);


// PUT METHOD
router.put(
  "/update-activity/:id",
  validateDTO(UpdateActivityDto),
  wrapAsync(activityController.updateActivityController) 
);


// DELETE METHOD
router.delete("/delete-activity/:id", wrapAsync(activityController.deleteActivityController));


// GET METHOD

// เรียกดู activity ทั้งแบบที่เป็น Public และ Private และยังไม่ถึงเวลาปิดให้ทำแบบประเมิน
// แต่เอาจริงน่าจะเปลี่ยนเป็นอะไรสักอย่างที่สื่อความหมายมากกว่านี้
router.get("/get-activities", wrapAsync(activityController.getAllActivitiesController));    

// เรียกดูรายกิจกรรม
router.get("/get-activity/:id", wrapAsync(activityController.getActivityByIdController));

// ค้นหากิจกรรมตามชื่อ บริษัท/วิทยากร หรือ ชื่อกิจกรรม
router.get("/searchActivity", wrapAsync(activityController.searchActivityController));

// เรียกดูนิสิตที่ enroll เข้ามาในแต่ละกิจกรรม
router.get("/get-enrolled-studentslist/:id", wrapAsync(activityController.searchActivityController));

export default router;
