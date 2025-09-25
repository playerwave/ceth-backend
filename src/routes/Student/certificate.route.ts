// src/routes/Student/certificate.route.ts
import { Router } from "express";
import { CertificateController } from "../../controllers/Student/certificate.controller";
import { verifyToken } from "../../middleware/verifyToken";
import { CheckRole } from "../../middleware/CheckRole";

const router = Router();
const certificateController = new CertificateController();

// GET /api/student/certificate/get-certificate/:id
router.get(
  "/get-certificate/:id",
  verifyToken,
  CheckRole(["Student"]),
  certificateController.getCertificateById.bind(certificateController)
);

export default router;
