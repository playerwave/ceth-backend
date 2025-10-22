// import express
import {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

// import controller เพื่อทดสอบโครงสร้างใหม่
import { activityController } from "../../controllers/Teacher/activity.controller";

// import validate function & middleware
import { validateDTO } from "../../middleware/validateDTO.validator";
import { requestValidator } from "../../middleware/requestValidator";
import upload, { uploadExcel } from "../../middleware/multer";

// import utils
import { wrapAsync } from "../../utils/wrapAsync";

// import DTO
import { CreateActivityDto } from "../../dtos/activity/create-activity.dto";
import { UpdateActivityDto } from "../../dtos/activity/update-activity.dto";

const router = Router();

// POST METHOD
router.post(
  "/create-activity",
  upload.single("image_url"), // ✅ เพิ่ม Multer Middleware สำหรับอัปโหลดไฟล์
  validateDTO(CreateActivityDto),
  wrapAsync(activityController.create)
);

// ✅ Bulk create activities from Excel or JSON
// Multer เป็น optional: ถ้ามีไฟล์ก็จะ parse, ถ้าไม่มีก็รับ JSON ธรรมดา
router.post(
  "/bulk-create-activities",
  (req, res, next) => {
    // ✅ ตรวจสอบว่ามี Content-Type เป็น multipart/form-data หรือไม่
    const contentType = req.headers['content-type'] || '';
    
    console.log(`🔍 [bulk-create-activities] Content-Type: ${contentType}`);
    
    if (contentType.includes('multipart/form-data')) {
      // ✅ ถ้ามีไฟล์ ให้ใช้ uploadExcel (memoryStorage)
      console.log('📎 [bulk-create-activities] Detected multipart/form-data, using uploadExcel');
      uploadExcel.single("file")(req, res, (err) => {
        if (err) {
          // ✅ ถ้า multer error (เช่น ไม่มีไฟล์) ให้ผ่านไปเลย
          console.log('⚠️ [bulk-create-activities] Multer error, assuming JSON request:', err.message);
          next();
        } else {
          next();
        }
      });
    } else {
      // ✅ ถ้าเป็น JSON ให้ผ่านไปเลย
      console.log('📝 [bulk-create-activities] Detected JSON request, skipping multer');
      next();
    }
  },
  wrapAsync(activityController.bulkCreateActivities)
);

router.get("/get-search", (activityController.getSearch))

// ✅ Dashboard summary routes
router.get("/active-years", wrapAsync(activityController.getActiveActivityYears));
router.get("/summary", wrapAsync(activityController.getActivitySummary));

// ✅ Mock data routes
router.post("/mock-all-registrations", wrapAsync(activityController.mockAllActivityRegistrations));

// PUT METHOD
router.put(
  "/update-activity/:id",
  validateDTO(UpdateActivityDto),
  wrapAsync(activityController.update)
);

// DELETE METHOD
// ✅ ไม่ใช้ body-parser สำหรับ DELETE request
router.delete("/delete-activity/:id", 
  (req, res, next) => {
    // ✅ Skip body parsing สำหรับ DELETE request
    console.log("🗑️ [DELETE] Activity delete request for ID:", req.params.id);
    next();
  },
  wrapAsync(activityController.delete)
);

// // GET METHOD

// // เรียกดู activity ทั้งแบบที่เป็น Public และ Private และยังไม่ถึงเวลาปิดให้ทำแบบประเมิน
// // แต่เอาจริงน่าจะเปลี่ยนเป็นอะไรสักอย่างที่สื่อความหมายมากกว่านี้
router.get("/get-activities", wrapAsync(activityController.getAll));

router.get("/get-activities-history", wrapAsync(activityController.getActivityByHistory));

router.get("/get-activity/:id", wrapAsync(activityController.getActivity));

// ✅ เพิ่ม debug route สำหรับตรวจสอบ certificate template
router.get("/debug-certificate/:id", wrapAsync(activityController.debugCertificateTemplate));

// ✅ เพิ่ม search route
router.get("/search", (activityController.search));

router.patch(
  "/update-activity-status/:activity_id",
  wrapAsync(activityController.updateByStatus)
);

// ✅ GET METHOD สำหรับดึงข้อมูลนักเรียนที่ลงทะเบียน
router.get(
  "/get-enrolled-students/:activityId",
  wrapAsync(activityController.getEnrolledStudentsForActivity)
);

// ✅ ActivityDetail Routes
router.get("/activity-details", wrapAsync(activityController.getAllActivityDetails));
router.get("/activity-detail/:id", wrapAsync(activityController.getActivityDetailById));
router.get("/activity-details/by-activity/:activityId", wrapAsync(activityController.getActivityDetailsByActivityId));
router.put("/update-activity-detail/:id", wrapAsync(activityController.updateActivityDetail));

// เพิ่ม route สำหรับ reset ActivityDetail และ Join
router.delete("/reset-activity-details/:activityId", wrapAsync(activityController.resetActivityDetailsAndJoins));

// เพิ่ม route สำหรับ reset time_in และ time_out ของนักเรียน
router.patch("/reset-student-times/:activityId", wrapAsync(activityController.resetStudentTimes));

// ✅ Routes สำหรับ Check-in/Check-out All Students
router.get("/students-checked-in/:activityId", wrapAsync(activityController.getStudentsCheckedIn));
router.get("/students-checked-out/:activityId", wrapAsync(activityController.getStudentsCheckedOut));

// ดูคำตอบของนักเรียนใน Activity (JOIN กับ activity_detail, join, answer)
router.get("/student-answers-detail/:activityId", wrapAsync(activityController.getStudentAnswersDetail));

// ดูข้อมูล Assessment Structure และ Student Answers รวมกัน
router.get("/complete-assessment-data/:activityId", wrapAsync(activityController.getCompleteAssessmentData));

// ตรวจสอบและสร้างข้อมูล Assessment Structure ตัวอย่าง
router.post("/create-sample-assessment/:activityId", wrapAsync(activityController.checkAndCreateSampleAssessmentData));

// ✅ Reset การทำแบบประเมินของนิสิตในกิจกรรม
router.delete("/reset-assessment/:activityId", wrapAsync(activityController.resetAssessmentForActivity));

export default router;
