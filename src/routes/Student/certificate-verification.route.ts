// src/routes/Student/certificate-verification.route.ts
import { Router } from "express";
import { certificateVerificationController } from "../../controllers/Student/certificate-verification.controller";
import { verifyToken } from "../../middleware/verifyToken";
import { CheckRole } from "../../middleware/CheckRole";
import { uploadImage } from "../../middleware/multer";
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();

// ✅ POST METHOD สำหรับอัปโหลด Certificate พร้อม Verification
router.post(
  "/upload-with-verification",
  verifyToken,
  CheckRole(["Student"]),
  uploadImage.single("file"),
  wrapAsync(certificateVerificationController.uploadCertificateWithVerification.bind(certificateVerificationController))
);

// ✅ POST METHOD สำหรับอัปโหลดลิ้งก์ Certificate พร้อม Verification
router.post(
  "/upload-link-with-verification",
  verifyToken,
  CheckRole(["Student"]),
  wrapAsync(certificateVerificationController.uploadLinkWithVerification.bind(certificateVerificationController))
);

export default router;
