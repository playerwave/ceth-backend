import { Router } from "express";
import { AssessmentVersionController } from "../../../controllers/Assessment/assessment-version.controller";

const router = Router();
const assessmentVersionController = new AssessmentVersionController();

// สร้างเวอร์ชันใหม่
router.post("/:assessmentId/versions", assessmentVersionController.createVersion.bind(assessmentVersionController));

// Publish เวอร์ชัน
router.post("/:assessmentId/versions/:versionId/publish", assessmentVersionController.publishVersion.bind(assessmentVersionController));

// ดึงประวัติเวอร์ชัน
router.get("/:assessmentId/versions", assessmentVersionController.getVersionHistory.bind(assessmentVersionController));

// ดึงเวอร์ชันตาม ID
router.get("/:assessmentId/versions/:versionId", assessmentVersionController.getVersionById.bind(assessmentVersionController));

// Clone เวอร์ชัน
router.post("/:assessmentId/versions/:versionId/clone", assessmentVersionController.cloneVersion.bind(assessmentVersionController));

export default router;
