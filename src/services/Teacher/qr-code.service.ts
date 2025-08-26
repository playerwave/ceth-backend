import { QRCodeDao } from "../../daos/Teacher/qr-code.dao";
import { ErrorHandledService } from "../error.handdled.service";

export class QRCodeService extends ErrorHandledService {
  private readonly qrCodeDao = new QRCodeDao();

  //--------------------- Generate QR Code Token -------------------------
  async generateQRCodeToken(activityId: number) {
    try {
      console.log("🔐 Service: Generating QR Code token for activity:", activityId);
      
      const result = await this.qrCodeDao.generateQRCodeToken(activityId);
      
      console.log("✅ Service: QR Code token generated successfully", {
        activityId,
        hasToken: !!result.token,
        hasQrCodeUrl: !!result.qrCodeUrl,
        expiresAt: result.expiresAt
      });
      
      this.logInfo("✅ QR Code token generated successfully", {
        activityId,
        token: result.token,
        expiresAt: result.expiresAt
      });
      
      return result;
    } catch (error) {
      console.error("❌ Service: Error generating QR Code token:", error);
      this.logError("❌ Error generating QR Code token", error);
      throw error;
    }
  }
  //----------------------------------------------------------------

  //--------------------- Reset QR Code Token -------------------------
  async resetQRCodeToken(activityId: number) {
    try {
      console.log("🔄 Service: Resetting QR Code token for activity:", activityId);
      
      const result = await this.qrCodeDao.resetQRCodeToken(activityId);
      
      console.log("✅ Service: QR Code token reset successfully", {
        activityId,
        hasToken: !!result.token,
        hasQrCodeUrl: !!result.qrCodeUrl,
        expiresAt: result.expiresAt
      });
      
      this.logInfo("✅ QR Code token reset successfully", {
        activityId,
        token: result.token,
        expiresAt: result.expiresAt
      });
      
      return result;
    } catch (error) {
      console.error("❌ Service: Error resetting QR Code token:", error);
      this.logError("❌ Error resetting QR Code token", error);
      throw error;
    }
  }
  //----------------------------------------------------------------

  //--------------------- Scan QR Code -------------------------
  async scanQRCode(token: string, studentId: number) {
    try {
      console.log("📱 Service: Scanning QR Code with token:", token);
      console.log("📱 Service: Student ID:", studentId);
      
      const result = await this.qrCodeDao.scanQRCode(token, studentId);
      
      console.log("✅ Service: QR Code scan completed", {
        token: token.substring(0, 8) + "...",
        studentId,
        activityId: result.activityId,
        success: result.success,
        message: result.message
      });
      
      this.logInfo("✅ QR Code scan completed", {
        token: token.substring(0, 8) + "...",
        studentId,
        activityId: result.activityId,
        success: result.success
      });
      
      return result;
    } catch (error) {
      console.error("❌ Service: Error scanning QR Code:", error);
      this.logError("❌ Error scanning QR Code", error);
      throw error;
    }
  }
  //----------------------------------------------------------------

  //--------------------- Validate Token -------------------------
  async validateToken(token: string): Promise<{ valid: boolean }> {
    try {
      console.log("🔍 Service: Validating token:", token);
      
      const isValid = await this.qrCodeDao.validateToken(token);
      
      this.logInfo("✅ Token validation completed", {
        token,
        isValid
      });
      
      return { valid: isValid };
    } catch (error) {
      this.logError("❌ Error validating token", error);
      return { valid: false };
    }
  }
  //----------------------------------------------------------------

  //--------------------- Get QR Code Status -------------------------
  async getQRCodeStatus(activityId: number) {
    try {
      console.log("📊 Service: Getting QR Code status for activity:", activityId);
      
      const status = await this.qrCodeDao.getQRCodeStatus(activityId);
      
      this.logInfo("✅ QR Code status retrieved", {
        activityId,
        isActive: status.isActive,
        expiresAt: status.expiresAt
      });
      
      return status;
    } catch (error) {
      this.logError("❌ Error getting QR Code status", error);
      throw error;
    }
  }
  //----------------------------------------------------------------

  //--------------------- Revoke Token -------------------------
  async revokeToken(activityId: number) {
    try {
      console.log("🗑️ Service: Revoking tokens for activity:", activityId);
      
      await this.qrCodeDao.revokeAllTokensForActivity(activityId);
      
      this.logInfo("✅ Tokens revoked successfully", { activityId });
    } catch (error) {
      this.logError("❌ Error revoking tokens", error);
      throw error;
    }
  }
  //----------------------------------------------------------------

  //--------------------- Cleanup Expired Tokens -------------------------
  async cleanupExpiredTokens() {
    try {
      console.log("🧹 Service: Cleaning up expired tokens");
      
      await this.qrCodeDao.cleanupExpiredTokens();
      
      this.logInfo("✅ Expired tokens cleaned up");
    } catch (error) {
      this.logError("❌ Error cleaning up expired tokens", error);
    }
  }
  //----------------------------------------------------------------
}
