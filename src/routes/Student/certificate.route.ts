// src/routes/Student/certificate.route.ts
import { Router } from "express";
import { CertificateController } from "../../controllers/Student/certificate.controller";
import { verifyToken } from "../../middleware/verifyToken";
import certificateVerificationRouter from "./certificate-verification.route";
import { wrapAsync } from "../../utils/wrapAsync";
const router = Router();
const certificateController = new CertificateController();

// POST /api/student/certificate/upload - อัปโหลดใบรับรอง
router.post(
  "/upload",
  verifyToken,
  wrapAsync(certificateController.uploadCertificate.bind(certificateController))
);

// GET /api/student/certificate/get-certificate/:id
router.get(
  "/get-certificate/:id",
  verifyToken,
  wrapAsync(certificateController.getCertificateById.bind(certificateController))
);

// GET /api/student/certificate/get-certificates
router.get(
  "/get-certificates",
  verifyToken,
  
  wrapAsync(certificateController.getCertificatesByStudentId.bind(certificateController))
);

// ✅ เพิ่ม Certificate Verification Routes
router.use("/", certificateVerificationRouter);

export default router;
