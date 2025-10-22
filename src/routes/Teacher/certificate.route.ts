// import express
import {
  Router,
  Request,
  Response,
  NextFunction,
} from "express";

// import controller
import { certificateController } from "../../controllers/Teacher/certificate.controller";

// import validate function & middleware
import { validateDTO } from "../../middleware/validateDTO.validator";
import { requestValidator } from "../../middleware/requestValidator";
import upload, { uploadImage } from "../../middleware/multer";

// import utils
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();

// ==================== CERTIFICATE TEMPLATE ROUTES ====================

// POST: สร้าง Certificate Template ใหม่
router.post(
  "/create-template",
  validateDTO(Object), // TODO: สร้าง DTO สำหรับ Certificate Template
  wrapAsync(certificateController.createCertificateTemplate)
);

// POST: สร้าง Certificate Template สำหรับ Activity
router.post(
  "/activity/:activityId/template",
  uploadImage.single("certificate_file"),
  (req, res, next) => {
    // ✅ Debug middleware เพื่อตรวจสอบ file object
    console.log("🔍 [Certificate Route] File object after multer:", {
      hasFile: !!req.file,
      filename: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
      hasBuffer: !!req.file?.buffer,
      bufferLength: req.file?.buffer?.length || 'undefined',
      fieldname: req.file?.fieldname
    });
    next();
  },
  wrapAsync(certificateController.createActivityCertificateTemplate)
);

// GET: ดึง Certificate Template ทั้งหมด
router.get(
  "/templates",
  wrapAsync(certificateController.getAllCertificateTemplates)
);

// GET: ดึง Certificate Template โดย ID
router.get(
  "/template/:id",
  wrapAsync(certificateController.getCertificateTemplateById)
);

// ==================== CERTIFICATE ROUTES ====================

// POST: สร้าง Certificate ใหม่
router.post(
  "/create",
  validateDTO(Object), // TODO: สร้าง DTO สำหรับ Certificate
  wrapAsync(certificateController.createCertificate)
);

// GET: ดึง Certificate โดย ID
router.get(
  "/:id",
  wrapAsync(certificateController.getCertificateById)
);

// PUT: อัปเดต Certificate
router.put(
  "/:id",
  validateDTO(Object), // TODO: สร้าง DTO สำหรับ Certificate Update
  wrapAsync(certificateController.updateCertificate)
);

// POST: ตรวจสอบ Certificate (พร้อมอัปโหลดไฟล์)
router.post(
  "/:id/verify",
  upload.single("certificate_file"), // ใช้ Multer สำหรับอัปโหลดไฟล์
  wrapAsync(certificateController.verifyCertificate)
);

// GET: ดึง Certificate Verification โดย Certificate ID
router.get(
  "/:certificateId/verifications",
  wrapAsync(certificateController.getVerificationsByCertificateId)
);

// GET: ดึง Certificate ทั้งหมดของนิสิต
router.get(
  "/student/:studentId",
  wrapAsync(certificateController.getCertificatesByStudentId)
);

// ==================== CERTIFICATE AUDIT ROUTES ====================

// GET: ดึง Certificate Audit โดย Certificate ID
router.get(
  "/:certificateId/audits",
  wrapAsync(certificateController.getAuditsByCertificateId)
);

// ==================== CERTIFICATE BASE ROUTES ====================

// POST: สร้าง Certificate Base ใหม่
router.post(
  "/base/create",
  validateDTO(Object), // TODO: สร้าง DTO สำหรับ Certificate Base
  wrapAsync(certificateController.createCertificateBase)
);

// GET: ดึง Certificate Base โดย Activity ID
router.get(
  "/base/activity/:activityId",
  wrapAsync(certificateController.getCertificateBaseByActivityId)
);

// ==================== ANALYTICS ROUTES ====================

// GET: ดึงสถิติการตรวจสอบ Certificate
router.get(
  "/analytics/verification-stats",
  wrapAsync(certificateController.getCertificateVerificationStats)
);

// GET: ดึง Certificate ที่รอการตรวจสอบ
router.get(
  "/pending/list",
  wrapAsync(certificateController.getPendingCertificates)
);

export default router;


