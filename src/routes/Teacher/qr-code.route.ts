import { Router } from "express";
import { qrCodeControllerInstance } from "../../controllers/Teacher/qr-code.controller";
import { verifyToken } from "../../middleware/verifyToken";
import { CheckRole } from "../../middleware/CheckRole";
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();

//--------------------- QR Code Routes -------------------------

// Generate QR Code Token
router.post(
  "/generate/:activityId",
  verifyToken,
  wrapAsync(qrCodeControllerInstance.generateQRCodeToken)
);

// Reset QR Code Token (revoke old + generate new)
router.post(
  "/reset/:activityId",
  verifyToken,
  wrapAsync(qrCodeControllerInstance.resetQRCodeToken)
);

// Scan QR Code (public endpoint - no auth required for students)
router.post(
  "/scan",
  wrapAsync(qrCodeControllerInstance.scanQRCode)
);

// Validate Token (public endpoint - no auth required)
router.post(
  "/validate",
  wrapAsync(qrCodeControllerInstance.validateToken)
);

// Get QR Code Status
router.get(
  "/status/:activityId",
  verifyToken,
  wrapAsync(qrCodeControllerInstance.getQRCodeStatus)
);

// Revoke Token
router.delete(
  "/revoke/:activityId",
  verifyToken,
  wrapAsync(qrCodeControllerInstance.revokeToken)
);

// Cleanup Expired Tokens (admin only)
router.post(
  "/cleanup",
  verifyToken,
  wrapAsync(qrCodeControllerInstance.cleanupExpiredTokens)
);

//----------------------------------------------------------------

export default router;
