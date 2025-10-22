import { DataSource, Repository } from "typeorm";
import { Certificate } from "../../entity/certificate/certificate.entity";
import { CertificateTemplate } from "../../entity/certificate/certificate-template.entity";
import { CertificateVerification } from "../../entity/certificate/certificate-verification.entity";
import { CertificateAudit } from "../../entity/certificate/certificate-audit.entity";
import { CertificateBase } from "../../entity/certificate/certificate-base.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class CertificateDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ [CertificateDao] Database connection initialized");
    } catch (error) {
      console.error("❌ [CertificateDao] Failed to initialize database connection:", error);
      throw error;
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      await this.initialize();
    }
  }

  // ==================== CERTIFICATE TEMPLATE METHODS ====================

  /**
   * สร้าง Activity Certificate Template
   */
  public async createActivityCertificateTemplate(
    activityId: number,
    data: {
      template_url: string;
      ocr_data: any;
      image_analysis: any;
      description: string | null;
    }
  ): Promise<any> {
    await this.checkConnection();
    try {
      console.log("💾 [CertificateDao] Creating/Updating activity certificate template:", {
        activity_id: activityId,
        template_url: data.template_url,
        has_ocr_data: !!data.ocr_data,
        has_image_analysis: !!data.image_analysis,
        description: data.description
      });

      const queryRunner = this.dataSource!.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 1. เช็คว่า activity นี้มี certificate_base อยู่แล้วหรือไม่
        console.log("🔍 [CertificateDao] Checking existing certificate_base for activity:", activityId);
        const existingBase = await queryRunner.query(
          `SELECT certificate_base_id FROM certificate_base WHERE activity_id = $1`,
          [activityId]
        );

        let templateResult;
        let isUpdate = false;

        if (existingBase && existingBase.length > 0) {
          // ✅ มีอยู่แล้ว → UPDATE
          const certificateBaseId = existingBase[0].certificate_base_id;
          console.log("🔄 [CertificateDao] Updating existing certificate_base:", certificateBaseId);
          
          templateResult = await queryRunner.query(
            `
            UPDATE certificate_base
            SET 
              template_image_url = $1,
              ocr_data = $2,
              image_analysis = $3,
              description = $4,
              updated_at = NOW()
            WHERE certificate_base_id = $5
            RETURNING certificate_base_id, certificate_name, template_image_url, description
            `,
            [
              data.template_url,
              JSON.stringify(data.ocr_data),
              JSON.stringify(data.image_analysis),
              data.description,
              certificateBaseId
            ]
          );
          isUpdate = true;
          console.log("✅ [CertificateDao] Certificate base updated successfully");
        } else {
          // ✅ ยังไม่มี → สร้างใหม่ใน certificate_base
          console.log("🔄 [CertificateDao] Creating new certificate_base...");
          
          templateResult = await queryRunner.query(
            `
            INSERT INTO certificate_base (
              activity_id,
              certificate_name,
              certificate_source,
              template_image_url,
              ocr_data,
              image_analysis,
              description,
              is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING certificate_base_id, certificate_name, template_image_url, description
            `,
            [
              activityId,
              `Certificate for Activity ${activityId}`,
              'Activity Template',
              data.template_url,
              JSON.stringify(data.ocr_data),
              JSON.stringify(data.image_analysis),
              data.description,
              true
            ]
          );
          console.log("✅ [CertificateDao] Certificate base created successfully");
        }

        const resultId = templateResult[0].certificate_base_id;

        await queryRunner.commitTransaction();
        
        console.log(`✅ [CertificateDao] Activity certificate template ${isUpdate ? 'updated' : 'created'} successfully:`, { 
          certificate_base_id: resultId,
          activity_id: activityId
        });
        
        return {
          template_id: resultId,
          template_name: templateResult[0].certificate_name,
          template_url: templateResult[0].template_image_url,
          description: templateResult[0].description,
          activity_id: activityId,
          is_update: isUpdate
        };
      } catch (error) {
        console.error("❌ [CertificateDao] Error during transaction:", error);
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error("❌ [CertificateDao] Database error:", error);
      this.logDbError("createActivityCertificateTemplate", error);
      throw new Error("❌ Failed to create/update activity certificate template");
    }
  }

  /**
   * ดึง Activity Certificate Template ตาม activity_id
   */
  public async getActivityCertificateTemplate(activityId: number): Promise<any | null> {
    await this.checkConnection();
    try {
      console.log("🔍 [CertificateDao] Getting certificate template for activity:", activityId);

      const result = await this.dataSource!.query(
        `
        SELECT
          act.template_id,
          act.template_name,
          act.template_url,
          act.ocr_data,
          act.image_analysis,
          act.description,
          act.is_active,
          act.created_at,
          act.updated_at,
          a.activity_id
        FROM activity a
        LEFT JOIN activity_certificate_template act ON a.certificate_template_id = act.template_id
        WHERE a.activity_id = $1
        `,
        [activityId]
      );

      // ✅ เพิ่ม log เพื่อตรวจสอบผลลัพธ์ของ query
      console.log("📊 [CertificateDao] Raw query result for activity", activityId, ":", result);

      if (result && result[0] && result[0].template_id) {
        console.log("📄 [CertificateDao] Certificate template found:", {
          template_id: result[0].template_id,
          template_name: result[0].template_name,
          template_url: result[0].template_url // ✅ เพิ่ม URL ใน log
        });
        return result[0];
      } else {
        console.log("⚠️ [CertificateDao] No certificate template found for activity:", activityId);
        return null;
      }
    } catch (error) {
      this.logDbError("getActivityCertificateTemplate", error);
      throw new Error("❌ Failed to retrieve activity certificate template");
    }
  }

  /**
   * สร้าง Certificate Template ใหม่
   */
  public async createCertificateTemplate(data: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
    await this.checkConnection();
    try {
      const templateRepository = this.dataSource!.getRepository(CertificateTemplate);
      const template = templateRepository.create(data);
      const savedTemplate = await templateRepository.save(template);
      
      console.log("✅ [CertificateDao] Certificate template created", { template_id: savedTemplate.template_id });
      return savedTemplate;
    } catch (error) {
      this.logDbError("createCertificateTemplate", error);
      throw new Error("❌ Failed to create certificate template");
    }
  }

  /**
   * ดึง Certificate Base ทั้งหมด
   */
  public async getAllCertificateTemplates(): Promise<CertificateBase[]> {
    await this.checkConnection();
    try {
      const templateRepository = this.dataSource!.getRepository(CertificateBase);
      const templates = await templateRepository.find({
        where: { is_active: true },
        order: { created_at: "DESC" }
      });
      
      console.log("📥 [CertificateDao] Retrieved certificate templates", { count: templates.length });
      return templates;
    } catch (error) {
      this.logDbError("getAllCertificateTemplates", error);
      throw new Error("❌ Failed to retrieve certificate templates");
    }
  }

  /**
   * ดึง Certificate Template โดย ID
   */
  public async getCertificateTemplateById(templateId: number): Promise<CertificateTemplate | null> {
    await this.checkConnection();
    try {
      const templateRepository = this.dataSource!.getRepository(CertificateTemplate);
      const template = await templateRepository.findOne({
        where: { template_id: templateId, is_active: true }
      });
      
      return template;
    } catch (error) {
      this.logDbError("getCertificateTemplateById", error);
      throw new Error("❌ Failed to retrieve certificate template");
    }
  }

  // ==================== CERTIFICATE METHODS ====================

  /**
   * สร้าง Certificate ใหม่
   */
  public async createCertificate(data: Partial<Certificate>): Promise<Certificate> {
    await this.checkConnection();
    try {
      const certificateRepository = this.dataSource!.getRepository(Certificate);
      const certificate = certificateRepository.create(data);
      const savedCertificate = await certificateRepository.save(certificate);
      
      console.log("✅ [CertificateDao] Certificate created", { certificate_id: savedCertificate.certificate_id });
      return savedCertificate;
    } catch (error) {
      this.logDbError("createCertificate", error);
      throw new Error("❌ Failed to create certificate");
    }
  }

  /**
   * ดึง Certificate โดย ID
   */
  public async getCertificateById(certificateId: number): Promise<Certificate | null> {
    await this.checkConnection();
    try {
      const certificateRepository = this.dataSource!.getRepository(Certificate);
      const certificate = await certificateRepository.findOne({
        where: { certificate_id: certificateId }
      });
      
      return certificate;
    } catch (error) {
      this.logDbError("getCertificateById", error);
      throw new Error("❌ Failed to retrieve certificate");
    }
  }

  /**
   * ดึง Certificate ทั้งหมดของนิสิต
   */
  public async getCertificatesByStudentId(studentId: number): Promise<Certificate[]> {
    await this.checkConnection();
    try {
      const certificateRepository = this.dataSource!.getRepository(Certificate);
      const certificates = await certificateRepository.find({
        where: { students_id: studentId },
        order: { uploaded_at: "DESC" }
      });
      
      console.log("📥 [CertificateDao] Retrieved certificates by student", { 
        studentId, 
        count: certificates.length 
      });
      return certificates;
    } catch (error) {
      this.logDbError("getCertificatesByStudentId", error);
      throw new Error("❌ Failed to retrieve certificates by student");
    }
  }

  /**
   * อัปเดต Certificate
   */
  public async updateCertificate(certificateId: number, data: Partial<Certificate>): Promise<Certificate | null> {
    await this.checkConnection();
    try {
      const certificateRepository = this.dataSource!.getRepository(Certificate);
      await certificateRepository.update(certificateId, data);
      
      const updatedCertificate = await certificateRepository.findOne({
        where: { certificate_id: certificateId }
      });
      
      console.log("✅ [CertificateDao] Certificate updated", { certificate_id: certificateId });
      return updatedCertificate;
    } catch (error) {
      this.logDbError("updateCertificate", error);
      throw new Error("❌ Failed to update certificate");
    }
  }

  // ==================== CERTIFICATE VERIFICATION METHODS ====================

  /**
   * สร้าง Certificate Verification ใหม่
   */
  public async createCertificateVerification(data: Partial<CertificateVerification>): Promise<CertificateVerification> {
    await this.checkConnection();
    try {
      const verificationRepository = this.dataSource!.getRepository(CertificateVerification);
      const verification = verificationRepository.create(data);
      const savedVerification = await verificationRepository.save(verification);
      
      console.log("✅ [CertificateDao] Certificate verification created", { 
        verification_id: savedVerification.verification_id 
      });
      return savedVerification;
    } catch (error) {
      this.logDbError("createCertificateVerification", error);
      throw new Error("❌ Failed to create certificate verification");
    }
  }

  /**
   * ดึง Certificate Verification โดย Certificate ID
   */
  public async getVerificationsByCertificateId(certificateId: number): Promise<CertificateVerification[]> {
    await this.checkConnection();
    try {
      const verificationRepository = this.dataSource!.getRepository(CertificateVerification);
      const verifications = await verificationRepository.find({
        where: { certificate_id: certificateId },
        order: { verified_at: "DESC" }
      });
      
      return verifications;
    } catch (error) {
      this.logDbError("getVerificationsByCertificateId", error);
      throw new Error("❌ Failed to retrieve certificate verifications");
    }
  }

  // ==================== CERTIFICATE AUDIT METHODS ====================

  /**
   * สร้าง Certificate Audit ใหม่
   */
  public async createCertificateAudit(data: Partial<CertificateAudit>): Promise<CertificateAudit> {
    await this.checkConnection();
    try {
      const auditRepository = this.dataSource!.getRepository(CertificateAudit);
      const audit = auditRepository.create(data);
      const savedAudit = await auditRepository.save(audit);
      
      console.log("✅ [CertificateDao] Certificate audit created", { 
        audit_id: savedAudit.audit_id 
      });
      return savedAudit;
    } catch (error) {
      this.logDbError("createCertificateAudit", error);
      throw new Error("❌ Failed to create certificate audit");
    }
  }

  /**
   * ดึง Certificate Audit โดย Certificate ID
   */
  public async getAuditsByCertificateId(certificateId: number): Promise<CertificateAudit[]> {
    await this.checkConnection();
    try {
      const auditRepository = this.dataSource!.getRepository(CertificateAudit);
      const audits = await auditRepository.find({
        where: { certificate_id: certificateId },
        order: { performed_at: "DESC" }
      });
      
      return audits;
    } catch (error) {
      this.logDbError("getAuditsByCertificateId", error);
      throw new Error("❌ Failed to retrieve certificate audits");
    }
  }

  // ==================== CERTIFICATE BASE METHODS ====================

  /**
   * สร้าง Certificate Base ใหม่
   */
  public async createCertificateBase(data: Partial<CertificateBase>): Promise<CertificateBase> {
    await this.checkConnection();
    try {
      const baseRepository = this.dataSource!.getRepository(CertificateBase);
      const base = baseRepository.create(data);
      const savedBase = await baseRepository.save(base);
      
      console.log("✅ [CertificateDao] Certificate base created", { 
        certificate_base_id: savedBase.certificate_base_id 
      });
      return savedBase;
    } catch (error) {
      this.logDbError("createCertificateBase", error);
      throw new Error("❌ Failed to create certificate base");
    }
  }

  /**
   * ดึง Certificate Base โดย Activity ID
   */
  public async getCertificateBaseByActivityId(activityId: number): Promise<CertificateBase | null> {
    await this.checkConnection();
    try {
      const baseRepository = this.dataSource!.getRepository(CertificateBase);
      const base = await baseRepository.findOne({
        where: { activity_id: activityId, is_active: true }
      });
      
      return base;
    } catch (error) {
      this.logDbError("getCertificateBaseByActivityId", error);
      throw new Error("❌ Failed to retrieve certificate base");
    }
  }

  // ==================== ANALYTICS METHODS ====================

  /**
   * ดึงสถิติการตรวจสอบ Certificate
   */
  public async getCertificateVerificationStats(): Promise<any> {
    await this.checkConnection();
    try {
      const verificationRepository = this.dataSource!.getRepository(CertificateVerification);
      
      const stats = await verificationRepository
        .createQueryBuilder("verification")
        .select([
          "AVG(verification.verification_results->>'confidenceScore') as avg_confidence",
          "COUNT(*) as total_verifications",
          "COUNT(CASE WHEN verification.verification_results->>'isAuthentic' = 'true' THEN 1 END) as authentic_count",
          "COUNT(CASE WHEN verification.verification_results->>'isAuthentic' = 'false' THEN 1 END) as fake_count"
        ])
        .getRawOne();
      
      return stats;
    } catch (error) {
      this.logDbError("getCertificateVerificationStats", error);
      throw new Error("❌ Failed to retrieve verification statistics");
    }
  }

  /**
   * ดึง Certificate ที่รอการตรวจสอบ
   */
  public async getPendingCertificates(): Promise<Certificate[]> {
    await this.checkConnection();
    try {
      const certificateRepository = this.dataSource!.getRepository(Certificate);
      const certificates = await certificateRepository.find({
        where: { status: "Pending" },
        order: { uploaded_at: "ASC" }
      });
      
      return certificates;
    } catch (error) {
      this.logDbError("getPendingCertificates", error);
      throw new Error("❌ Failed to retrieve pending certificates");
    }
  }
}
