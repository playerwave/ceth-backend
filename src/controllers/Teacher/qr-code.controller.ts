import { Request, Response } from "express";
import { QRCodeService } from "../../services/Teacher/qr-code.service";
import { ErrorHandledController } from "../error.handled.controller";

export class QRCodeController extends ErrorHandledController {
  constructor(private readonly qrCodeService: QRCodeService) {
    super();
  }

  //--------------------- Generate QR Code Token -------------------------
  async generateQRCodeToken(req: Request, res: Response): Promise<void> {
    try {
      console.log("🔐 Controller: Request received:", {
        method: req.method,
        url: req.url,
        params: req.params,
        headers: req.headers.authorization ? "Bearer token present" : "No token"
      });

      const activityId = parseInt(req.params.activityId);
      
      if (isNaN(activityId)) {
        console.log("❌ Controller: Invalid activity ID:", req.params.activityId);
        res.status(400).json({ error: "Invalid activity ID" });
        return;
      }

      console.log("🔐 Controller: Generating QR Code token for activity:", activityId);
      
      const result = await this.qrCodeService.generateQRCodeToken(activityId);
      
      console.log("✅ Controller: QR Code token generated successfully:", {
        activityId,
        hasQrCodeUrl: !!result.qrCodeUrl,
        hasToken: !!result.token,
        expiresAt: result.expiresAt
      });
      
      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Controller: Error in generateQRCodeToken:", error);
      this.handleError("QRCodeController.generateQRCodeToken", error, res);
    }
  }
  //----------------------------------------------------------------

  //--------------------- Reset QR Code Token -------------------------
  async resetQRCodeToken(req: Request, res: Response): Promise<void> {
    try {
      console.log("🔄 Controller: Reset request received:", {
        method: req.method,
        url: req.url,
        params: req.params,
        headers: req.headers.authorization ? "Bearer token present" : "No token"
      });

      const activityId = parseInt(req.params.activityId);
      
      if (isNaN(activityId)) {
        console.log("❌ Controller: Invalid activity ID:", req.params.activityId);
        res.status(400).json({ error: "Invalid activity ID" });
        return;
      }

      console.log("🔄 Controller: Resetting QR Code token for activity:", activityId);
      
      const result = await this.qrCodeService.resetQRCodeToken(activityId);
      
      console.log("✅ Controller: QR Code token reset successfully:", {
        activityId,
        hasQrCodeUrl: !!result.qrCodeUrl,
        hasToken: !!result.token,
        expiresAt: result.expiresAt
      });
      
      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Controller: Error in resetQRCodeToken:", error);
      this.handleError("QRCodeController.resetQRCodeToken", error, res);
    }
  }
  //----------------------------------------------------------------

  //--------------------- Scan QR Code -------------------------
  async scanQRCode(req: Request, res: Response): Promise<void> {
    try {
      console.log("📱 Controller: Scan request received:", {
        method: req.method,
        url: req.url,
        body: req.body
      });

      const { token, studentId } = req.body;
      
      if (!token) {
        console.log("❌ Controller: No token provided in scan request");
        res.status(400).json({ error: "Token is required" });
        return;
      }

      if (!studentId) {
        console.log("❌ Controller: No student ID provided in scan request");
        res.status(400).json({ error: "Student ID is required" });
        return;
      }

      console.log("📱 Controller: Scanning QR Code with token:", token);
      console.log("📱 Controller: Student ID:", studentId);
      
      const result = await this.qrCodeService.scanQRCode(token, studentId);
      
      console.log("✅ Controller: QR Code scan successful:", {
        token: token.substring(0, 8) + "...",
        studentId,
        activityId: result.activityId,
        success: result.success,
        message: result.message
      });
      
      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Controller: Error in scanQRCode:", error);
      this.handleError("QRCodeController.scanQRCode", error, res);
    }
  }
  //----------------------------------------------------------------

  //--------------------- Validate Token -------------------------
  async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
      }

      console.log("🔍 Controller: Validating token:", token);
      
      const result = await this.qrCodeService.validateToken(token);
      
      res.status(200).json(result);
    } catch (error) {
      this.handleError("QRCodeController.validateToken", error, res);
    }
  }
  //----------------------------------------------------------------

  //--------------------- Get QR Code Status -------------------------
  async getQRCodeStatus(req: Request, res: Response): Promise<void> {
    try {
      const activityId = parseInt(req.params.activityId);
      
      if (isNaN(activityId)) {
        res.status(400).json({ error: "Invalid activity ID" });
        return;
      }

      console.log("📊 Controller: Getting QR Code status for activity:", activityId);
      
      const status = await this.qrCodeService.getQRCodeStatus(activityId);
      
      res.status(200).json(status);
    } catch (error) {
      this.handleError("QRCodeController.getQRCodeStatus", error, res);
    }
  }
  //----------------------------------------------------------------

  //--------------------- Revoke Token -------------------------
  async revokeToken(req: Request, res: Response): Promise<void> {
    try {
      const activityId = parseInt(req.params.activityId);
      
      if (isNaN(activityId)) {
        res.status(400).json({ error: "Invalid activity ID" });
        return;
      }

      console.log("🗑️ Controller: Revoking tokens for activity:", activityId);
      
      await this.qrCodeService.revokeToken(activityId);
      
      res.status(200).json({ message: "Tokens revoked successfully" });
    } catch (error) {
      this.handleError("QRCodeController.revokeToken", error, res);
    }
  }
  //----------------------------------------------------------------

  //--------------------- Cleanup Expired Tokens -------------------------
  async cleanupExpiredTokens(req: Request, res: Response): Promise<void> {
    try {
      console.log("🧹 Controller: Cleaning up expired tokens");
      
      await this.qrCodeService.cleanupExpiredTokens();
      
      res.status(200).json({ message: "Expired tokens cleaned up successfully" });
    } catch (error) {
      this.handleError("QRCodeController.cleanupExpiredTokens", error, res);
    }
  }
  //----------------------------------------------------------------
}

// สร้าง instance และ export
const qrCodeService = new QRCodeService();
const qrCodeController = new QRCodeController(qrCodeService);

export const qrCodeControllerInstance = {
  generateQRCodeToken: qrCodeController.generateQRCodeToken.bind(qrCodeController),
  resetQRCodeToken: qrCodeController.resetQRCodeToken.bind(qrCodeController),
  scanQRCode: qrCodeController.scanQRCode.bind(qrCodeController),
  validateToken: qrCodeController.validateToken.bind(qrCodeController),
  getQRCodeStatus: qrCodeController.getQRCodeStatus.bind(qrCodeController),
  revokeToken: qrCodeController.revokeToken.bind(qrCodeController),
  cleanupExpiredTokens: qrCodeController.cleanupExpiredTokens.bind(qrCodeController),
};
