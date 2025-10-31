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

// POST: Re-parse THAI MOOC data from existing certificate_base
router.post(
  "/reparse/:certificateBaseId",
  wrapAsync(certificateController.reparseCertificateBase)
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
  "/get-certificate/:id",
  wrapAsync(certificateController.getCertificateById)
);

// PUT: อัปเดต Certificate
router.put(
  "/update-certificate/:id",
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
  "/get-all-student-certificates/:studentId",
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
  "/create-certificate-base",
  validateDTO(Object), // TODO: สร้าง DTO สำหรับ Certificate Base
  wrapAsync(certificateController.createCertificateBase)
);

// GET: ดึง Certificate Base โดย Activity ID
router.get(
  "/get-certificate-base-by-activity-id/:activityId",
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
  "/get-pending-certificates/list",
  wrapAsync(certificateController.getPendingCertificates)
);

// GET: ดึง Certificate ที่ผ่านการตรวจสอบตาม activity_id
router.get(
  "/activity/:activityId/passed-certificates",
  wrapAsync(certificateController.getPassedCertificatesByActivity)
);

export default router;


