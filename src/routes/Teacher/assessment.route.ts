import { Router } from "express";
import { wrapAsync } from "../../utils/wrapAsync";
import { AssessmentController } from "../../controllers/Teacher/assessment.controller.teacher";
import { AssessmentService } from "../../services/Teacher/assessment.service";
import { verifyToken } from "../../middleware/verifyToken";
// import { validateDTO } from "../../middleware/validateDTO.validator";
// import { CreateAssessmentDto } from "../../dtos/assessment/create-assessment.dto";
// import { UpdateAssessmentDto } from "../../dtos/assessment/update-assessment.dto";

const router = Router();

// ✅ สร้าง instance ของ service และ controller
const assessmentService = new AssessmentService();
const assessmentController = new AssessmentController(assessmentService);

// ✅ GET /get-assessments → ดึงข้อมูลแบบ paginated
// Query parameters: ?type=latest|all|published&page=1&limit=10
// - latest: ดึงเวอร์ชันล่าสุดที่ published (default)
// - all: ดึงทั้งหมดแบบเดิม (ไม่ใช้ versioning)
// - published: ดึงเฉพาะที่มีเวอร์ชันที่ published
router.get(
  "/get-assessments",
  verifyToken,
  wrapAsync(assessmentController.getAll.bind(assessmentController))
);

// ✅ GET /count → จำนวนแบบประเมินทั้งหมด
router.get(
  "/count",
  verifyToken,
  wrapAsync(assessmentController.count.bind(assessmentController))
);

// ✅ POST /create-assessment → สร้างแบบประเมิน
router.post(
  "/create-assessment",
  verifyToken,
  // validateDTO(CreateAssessmentDto),
  wrapAsync(assessmentController.create.bind(assessmentController))
);

// ✅ PUT /update-assessment/:assessment_id → แก้ไขแบบประเมิน
router.put(
  "/update-assessment/:assessment_id",
  verifyToken,
  // validateDTO(UpdateAssessmentDto),
  wrapAsync(assessmentController.update.bind(assessmentController))
);

// ✅ DELETE /delete-assessment/:assessment_id → ลบแบบประเมิน
router.delete(
  "/delete-assessment/:id",
  assessmentController.delete.bind(assessmentController)
);

// ✅ GET /get-assessment/:assessment_id → ดึงแบบประเมินตาม ID
router.get(
  "/get-assessment/:assessment_id",
  verifyToken,
  wrapAsync(assessmentController.getById.bind(assessmentController))
);




router.get("/get-assessment-full/:id", (req, res) =>
  assessmentController.getAssessmentFullById(req, res)
);



router.post(
  "/create-assessment-full",
  (req, res) => assessmentController.createAssessmentFull(req, res)
);

// ==================== VERSIONING ROUTES ====================

// สร้างเวอร์ชันใหม่
router.post(
  "/:assessmentId/versions",
  verifyToken,
  wrapAsync(assessmentController.createVersion.bind(assessmentController))
);

// Publish เวอร์ชัน
router.post(
  "/:assessmentId/versions/:versionId/publish",
  verifyToken,
  wrapAsync(assessmentController.publishVersion.bind(assessmentController))
);

// ดึงประวัติเวอร์ชัน
router.get(
  "/:assessmentId/versions",
  verifyToken,
  wrapAsync(assessmentController.getVersionHistory.bind(assessmentController))
);

// ดึงเวอร์ชันล่าสุดที่ published
router.get(
  "/:assessmentId/versions/latest",
  verifyToken,
  wrapAsync(assessmentController.getLatestPublishedVersion.bind(assessmentController))
);

// ดึงเวอร์ชันพร้อมข้อมูลครบถ้วน
router.get(
  "/versions/:versionId",
  verifyToken,
  wrapAsync(assessmentController.getVersionWithFullData.bind(assessmentController))
);

// Clone เวอร์ชัน
router.post(
  "/:assessmentId/versions/:versionId/clone",
  verifyToken,
  wrapAsync(assessmentController.cloneVersion.bind(assessmentController))
);


export default router;
