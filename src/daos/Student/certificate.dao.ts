// src/daos/Student/certificate.dao.ts
import { getConnection } from "typeorm";
import { Certificate } from "../../entity/certificate/certificate.entity";

export class CertificateDAO {
  private getCertificateRepository() {
    return getConnection().getRepository(Certificate);
  }

  //--------------------- Get Certificate By Id -------------------------
  async getCertificateById(certificateId: number, userId: number): Promise<any> {
    console.log("🔍 [Certificate DAO] Getting certificate:", { certificateId, userId });
    
    try {
      const certificateRepository = this.getCertificateRepository();
      
      const certificate = await certificateRepository
        .createQueryBuilder("certificate")
        .leftJoinAndSelect("certificate.student", "student")
        .leftJoinAndSelect("certificate.teacher", "teacher")
        .leftJoinAndSelect("certificate.activity", "activity")
        .where("certificate.certificate_id = :certificateId", { certificateId })
        .andWhere("certificate.students_id = :userId", { userId })
        .getOne();

      if (!certificate) {
        console.log("❌ [Certificate DAO] Certificate not found or access denied");
        return null;
      }

      console.log("✅ [Certificate DAO] Certificate found:", certificate);
      return certificate;
    } catch (error) {
      console.error("❌ [Certificate DAO] Error:", error);
      throw error;
    }
  }
}
