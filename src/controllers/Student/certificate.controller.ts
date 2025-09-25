// src/controllers/Student/certificate.controller.ts
import { Request, Response } from "express";
import { CertificateService } from "../../services/Student/certificate.service";

export class CertificateController {
  private certificateService: CertificateService;

  constructor() {
    this.certificateService = new CertificateService();
  }

  //--------------------- Get Certificate By Id -------------------------
  getCertificateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.users_id; // Get user ID from token

      console.log("🔍 [Certificate Controller] Getting certificate:", { id, userId });

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const certificate = await this.certificateService.getCertificateById(
        parseInt(id),
        userId
      );

      if (!certificate) {
        res.status(404).json({ error: "Certificate not found or access denied" });
        return;
      }

      console.log("✅ [Certificate Controller] Certificate found:", certificate);
      res.json(certificate);
    } catch (error) {
      console.error("❌ [Certificate Controller] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
