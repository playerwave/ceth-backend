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
        .leftJoinAndSelect("certificate.students", "student")
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

  //--------------------- Get Certificates By Student ID -------------------------
  async getCertificatesByStudentId(studentId: number): Promise<any[]> {
    console.log("🔍 [Certificate DAO] Getting certificates for student:", { studentId });
    
    try {
      const certificateRepository = this.getCertificateRepository();
      
      const certificates = await certificateRepository
        .createQueryBuilder("certificate")
        .leftJoinAndSelect("certificate.students", "student")
        .leftJoinAndSelect("certificate.activity", "activity")
        .where("certificate.students_id = :studentId", { studentId })
        .orderBy("certificate.date", "DESC")
        .getMany();

      console.log("✅ [Certificate DAO] Certificates found:", certificates.length);
      return certificates;
    } catch (error) {
      console.error("❌ [Certificate DAO] Error:", error);
      throw error;
    }
  }

  //--------------------- Create Certificate -------------------------
  async createCertificate(data: Partial<Certificate>): Promise<Certificate> {
    console.log("📝 [Certificate DAO] Creating certificate:", {
      ...data,
      date: data.date ? (data.date instanceof Date ? data.date.toISOString() : data.date) : null,
      dateType: data.date ? typeof data.date : 'null'
    });
    
    try {
      const certificateRepository = this.getCertificateRepository();
      
      // ✅ ตรวจสอบและ sanitize date ก่อนสร้าง entity
      const sanitizedData = { ...data };
      
      // ✅ ถ้า date เป็น Invalid Date หรือ null ให้เป็น null
      if (sanitizedData.date) {
        if (sanitizedData.date instanceof Date) {
          if (isNaN(sanitizedData.date.getTime())) {
            console.warn("⚠️ [Certificate DAO] Invalid date detected, setting to null");
            sanitizedData.date = null;
          }
        } else if (typeof sanitizedData.date === 'string') {
          const parsed = new Date(sanitizedData.date);
          if (isNaN(parsed.getTime())) {
            console.warn("⚠️ [Certificate DAO] Invalid date string detected, setting to null");
            sanitizedData.date = null;
          } else {
            sanitizedData.date = parsed;
          }
        }
      }
      
      const certificate = certificateRepository.create(sanitizedData);
      const savedCertificate = await certificateRepository.save(certificate);

      console.log("✅ [Certificate DAO] Certificate created:", savedCertificate.certificate_id);
      return savedCertificate;
    } catch (error) {
      console.error("❌ [Certificate DAO] Create error:", error);
      throw error;
    }
  }
}
