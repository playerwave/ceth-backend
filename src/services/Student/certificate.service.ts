// src/services/Student/certificate.service.ts
import { CertificateDAO } from "../../daos/Student/certificate.dao";

export class CertificateService {
  private certificateDAO: CertificateDAO;

  constructor() {
    this.certificateDAO = new CertificateDAO();
  }

  //--------------------- Get Certificate By Id -------------------------
  async getCertificateById(certificateId: number, userId: number): Promise<any> {
    console.log("🔍 [Certificate Service] Getting certificate:", { certificateId, userId });
    
    try {
      const certificate = await this.certificateDAO.getCertificateById(certificateId, userId);
      
      if (!certificate) {
        console.log("❌ [Certificate Service] Certificate not found or access denied");
        return null;
      }

      console.log("✅ [Certificate Service] Certificate found:", certificate);
      return certificate;
    } catch (error) {
      console.error("❌ [Certificate Service] Error:", error);
      throw error;
    }
  }
}
