// src/routes/Student/certificate-link.route.ts

import { Router } from 'express';
import { CertificateLinkController } from '../../controllers/Student/certificate-link.controller';
import { verifyToken } from '../../middleware/verifyToken';

const router = Router();
const certificateLinkController = new CertificateLinkController();

// ✅ Debug middleware
router.use((req, res, next) => {
  console.log("🔍 [CertificateLinkRoute] Request received:", {
    method: req.method,
    url: req.url,
    path: req.path,
    body: req.body
  });
  next();
});

/**
 * GET /api/student/certificate/test
 * Test endpoint เพื่อตรวจสอบว่า route ทำงานหรือไม่
 */
router.get('/test', (req, res) => {
  console.log("🧪 [CertificateLinkRoute] Test endpoint called");
  res.json({ 
    success: true, 
    message: "Certificate link route is working!",
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/student/certificate/validate-link
 * ตรวจสอบลิ้งก์ใบรับรอง BUU MOOC
 */
router.post('/validate-link', verifyToken, certificateLinkController.validateCertificateLink.bind(certificateLinkController));

export default router;
