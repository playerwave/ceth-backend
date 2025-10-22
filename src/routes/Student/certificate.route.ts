// src/routes/Student/certificate.route.ts
import { Router } from "express";
import { CertificateController } from "../../controllers/Student/certificate.controller";
import { verifyToken } from "../../middleware/verifyToken";
import { CheckRole } from "../../middleware/CheckRole";
import upload from "../../middleware/multer";

const router = Router();
const certificateController = new CertificateController();

// POST /api/student/certificate/upload - อัปโหลดใบรับรอง
router.post(
  "/upload",
  verifyToken,
  CheckRole(["Student"]),
  upload.single("certificate"),
  certificateController.uploadCertificate.bind(certificateController)
);

// GET /api/student/certificate/get-certificate/:id
router.get(
  "/get-certificate/:id",
  verifyToken,
  CheckRole(["Student"]),
  certificateController.getCertificateById.bind(certificateController)
);

// GET /api/student/certificate/get-certificates
router.get(
  "/get-certificates",
  verifyToken,
  CheckRole(["Student"]),
  certificateController.getCertificatesByStudentId.bind(certificateController)
);

export default router;
