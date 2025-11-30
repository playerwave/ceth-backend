import { DataSource, Repository } from "typeorm";
import { Certificate } from "../../entity/certificate/certificate.entity";
import { CertificateTemplate } from "../../entity/certificate/certificate-template.entity";
import { CertificateVerification } from "../../entity/certificate/certificate-verification.entity";
import { CertificateAudit } from "../../entity/certificate/certificate-audit.entity";
import { CertificateBase } from "../../entity/certificate/certificate-base.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";
import { parseThaiMoocData } from "../../utils/naturalTextParser";

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

      // ✅ Parse THAI MOOC data from OCR natural_text
      let parsedThaiMoocData: ReturnType<typeof parseThaiMoocData> | null = null;
      if (data.ocr_data?.natural_text) {
        parsedThaiMoocData = parseThaiMoocData(data.ocr_data.natural_text);
        console.log("🔍 [CertificateDao] Parsed THAI MOOC data:", parsedThaiMoocData);
      }

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
          
          // ✅ Prepare fields for THAI MOOC
          const certificateName = parsedThaiMoocData?.certificate_name || `Certificate for Activity ${activityId}`;
          const certificateType = parsedThaiMoocData?.certificate_type || "Other";
          const organizationName = parsedThaiMoocData?.organize_base_name || null;
          const getCertificateDate = parsedThaiMoocData?.get_certificate_date || null;
          const supervisorName1 = parsedThaiMoocData?.supervisor_name1 || null;

          // ✅ Log parsed fields (UPDATE)
          console.log("📝 [CertificateDao] Prepared fields from THAI MOOC parsing (UPDATE):", {
            certificate_name: certificateName,
            certificate_type: certificateType,
            organize_base_name: organizationName,
            get_certificate_date: getCertificateDate,
            supervisor_name1: supervisorName1
          });

          templateResult = await queryRunner.query(
            `
            UPDATE certificate_base
            SET 
              template_image_url = $1,
              ocr_data = $2,
              image_analysis = $3,
              description = $4,
              certificate_name = $5,
              certificate_type = $6,
              organize_base_name = $7,
              get_certificate_date = $8,
              supervisor_name1 = $9,
              updated_at = NOW()
            WHERE certificate_base_id = $10
            RETURNING certificate_base_id, certificate_name, template_image_url, description
            `,
            [
              data.template_url,
              JSON.stringify(data.ocr_data),
              JSON.stringify(data.image_analysis),
              data.description,
              certificateName,
              certificateType,
              organizationName,
              getCertificateDate,
              supervisorName1,
              certificateBaseId
            ]
          );
          isUpdate = true;
          console.log("✅ [CertificateDao] Certificate base updated successfully");
        } else {
          // ✅ ยังไม่มี → สร้างใหม่ใน certificate_base
          console.log("🔄 [CertificateDao] Creating new certificate_base...");
          
          // ✅ Prepare fields for THAI MOOC
          const certificateName = parsedThaiMoocData?.certificate_name || `Certificate for Activity ${activityId}`;
          const certificateType = parsedThaiMoocData?.certificate_type || "Other";
          const organizationName = parsedThaiMoocData?.organize_base_name || null;
          const getCertificateDate = parsedThaiMoocData?.get_certificate_date || null;
          const supervisorName1 = parsedThaiMoocData?.supervisor_name1 || null;

          // ✅ Log parsed fields (INSERT)
          console.log("📝 [CertificateDao] Prepared fields from THAI MOOC parsing (INSERT):", {
            certificate_name: certificateName,
            certificate_type: certificateType,
            organize_base_name: organizationName,
            get_certificate_date: getCertificateDate,
            supervisor_name1: supervisorName1
          });

          templateResult = await queryRunner.query(
            `
            INSERT INTO certificate_base (
              activity_id,
              certificate_name,
              certificate_source,
              certificate_type,
              organize_base_name,
              get_certificate_date,
              supervisor_name1,
              template_image_url,
              ocr_data,
              image_analysis,
              description,
              is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING certificate_base_id, certificate_name, template_image_url, description
            `,
            [
              activityId,
              certificateName,
              'Activity Template',
              certificateType,
              organizationName,
              getCertificateDate,
              supervisorName1,
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
   * Re-parse THAI MOOC data from existing certificate_base
   */
  public async reparseCertificateBase(certificateBaseId: number): Promise<any> {
    await this.checkConnection();
    try {
      console.log("🔄 [CertificateDao] Re-parsing certificate_base:", certificateBaseId);

      // 1. ดึงข้อมูล certificate_base ที่มีอยู่
      const certificateBase = await this.dataSource!.query(
        `SELECT * FROM certificate_base WHERE certificate_base_id = $1`,
        [certificateBaseId]
      );

      if (!certificateBase || certificateBase.length === 0) {
        throw new Error(`Certificate base not found: ${certificateBaseId}`);
      }

      const ocrData = certificateBase[0].ocr_data;
      
      // 2. Parse THAI MOOC data from OCR natural_text
      let parsedThaiMoocData: ReturnType<typeof parseThaiMoocData> | null = null;
      if (ocrData?.natural_text) {
        parsedThaiMoocData = parseThaiMoocData(ocrData.natural_text);
        console.log("🔍 [CertificateDao] Re-parsed THAI MOOC data:", parsedThaiMoocData);
      } else {
        console.log("⚠️ [CertificateDao] No natural_text found in OCR data");
        throw new Error("No natural_text found in OCR data");
      }

      // 3. Prepare fields for THAI MOOC
      const certificateName = parsedThaiMoocData?.certificate_name || certificateBase[0].certificate_name;
      const certificateType = parsedThaiMoocData?.certificate_type || "Other";
      const organizationName = parsedThaiMoocData?.organize_base_name || null;
      const getCertificateDate = parsedThaiMoocData?.get_certificate_date || null;
      const supervisorName1 = parsedThaiMoocData?.supervisor_name1 || null;

      // ✅ Log parsed fields (REPARSE)
      console.log("📝 [CertificateDao] Prepared fields from THAI MOOC parsing (REPARSE):", {
        certificate_name: certificateName,
        certificate_type: certificateType,
        organization_name: organizationName,
        get_certificate_date: getCertificateDate,
        supervisor_name1: supervisorName1
      });

      // 4. Update certificate_base with parsed data
      const queryRunner = this.dataSource!.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const result = await queryRunner.query(
          `
          UPDATE certificate_base
          SET 
            certificate_name = $1,
            certificate_type = $2,
            organize_base_name = $3,
            get_certificate_date = $4,
            supervisor_name1 = $5,
            updated_at = NOW()
          WHERE certificate_base_id = $6
          RETURNING *
          `,
          [
            certificateName,
            certificateType,
            organizationName,
            getCertificateDate,
            supervisorName1,
            certificateBaseId
          ]
        );

        await queryRunner.commitTransaction();
        
        console.log("✅ [CertificateDao] Certificate base re-parsed successfully");
        return result[0];
      } catch (error) {
        console.error("❌ [CertificateDao] Error during re-parse transaction:", error);
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error("❌ [CertificateDao] Database error during re-parse:", error);
      this.logDbError("reparseCertificateBase", error);
      throw new Error("❌ Failed to re-parse certificate base");
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
   * ดึง Certificate ของนิสิตตาม status
   */
  public async getCertificatesByStatus(status: string, studentId?: number): Promise<Certificate[]> {
    await this.checkConnection();
    try {
      console.log("📥 [CertificateDao] Getting certificates by status:", {
        status,
        studentId: studentId || 'all'
      });
      
      const certificateRepository = this.dataSource!.getRepository(Certificate);
      
      // ✅ สร้าง where condition
      const whereCondition: any = { status };
      if (studentId) {
        whereCondition.students_id = studentId;
      }
      
      const certificates = await certificateRepository.find({
        where: whereCondition,
        order: { uploaded_at: "DESC" }
      });
      
      console.log("📥 [CertificateDao] Retrieved certificates by status", { 
        status,
        studentId: studentId || 'all',
        count: certificates.length 
      });
      
      return certificates;
    } catch (error) {
      this.logDbError("getCertificatesByStatus", error);
      throw new Error("❌ Failed to retrieve certificates by status");
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

  /**
   * ลบ Certificate ตาม ID
   */
  public async deleteCertificate(certificateId: number): Promise<boolean> {
    await this.checkConnection();
    try {
      console.log("🗑️ [CertificateDao] Deleting certificate:", certificateId);
      
      const certificateRepository = this.dataSource!.getRepository(Certificate);
      const certificateAuditRepository = this.dataSource!.getRepository(CertificateAudit);
      
      // ✅ ตรวจสอบว่า certificate มีอยู่จริงหรือไม่
      const certificate = await certificateRepository.findOne({
        where: { certificate_id: certificateId }
      });
      
      if (!certificate) {
        console.log("⚠️ [CertificateDao] Certificate not found:", certificateId);
        return false;
      }
      
      // ✅ ลบ records ที่เกี่ยวข้องก่อน (เพื่อให้ foreign key constraint ผ่าน)
      // ✅ 1. ลบ certificate_audit records
      try {
        const auditDeleteResult = await certificateAuditRepository.delete({
          certificate_id: certificateId
        });
        console.log("🗑️ [CertificateDao] Deleted audit logs:", {
          certificate_id: certificateId,
          deleted_count: auditDeleteResult.affected || 0
        });
      } catch (auditError) {
        console.warn("⚠️ [CertificateDao] Failed to delete audit logs (non-critical):", auditError);
        // ✅ ยังคงดำเนินการลบ certificate ต่อไป
      }
      
      // ✅ 2. ลบ certificate_verification records
      try {
        const verificationRepository = this.dataSource!.getRepository(CertificateVerification);
        const verificationDeleteResult = await verificationRepository.delete({
          certificate_id: certificateId
        });
        console.log("🗑️ [CertificateDao] Deleted verification records:", {
          certificate_id: certificateId,
          deleted_count: verificationDeleteResult.affected || 0
        });
      } catch (verificationError) {
        console.warn("⚠️ [CertificateDao] Failed to delete verification records (non-critical):", verificationError);
        // ✅ ยังคงดำเนินการลบ certificate ต่อไป
      }
      
      // ✅ ลบ certificate
      const deleteResult = await certificateRepository.delete(certificateId);
      
      const deleted = deleteResult.affected && deleteResult.affected > 0;
      
      if (deleted) {
        console.log("✅ [CertificateDao] Certificate deleted successfully", { certificate_id: certificateId });
      } else {
        console.log("⚠️ [CertificateDao] Certificate deletion failed (no rows affected)", { certificate_id: certificateId });
      }
      
      return deleted;
    } catch (error) {
      this.logDbError("deleteCertificate", error);
      throw new Error("❌ Failed to delete certificate");
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

  /**
   * ดึง Certificate ที่ผ่านการตรวจสอบตาม activity_id
   */
  public async getPassedCertificatesByActivity(activityId: number): Promise<any[]> {
    await this.checkConnection();
    try {
      console.log("📥 [CertificateDao] Getting passed certificates for activity:", activityId);
      
      const certificates = await this.dataSource!.query(
        `
        SELECT 
          c.certificate_id,
          c.students_id,
          c.activity_id,
          c.date,
          c.hours,
          c.img,
          c.status,
          c.certificate_type,
          c.organize_name,
          c.supervisor_name1,
          c.original_filename,
          c.uploaded_at,
          c.updated_at,
          s.first_name_eng,
          s.last_name_eng,
          s.first_name_tha,
          s.last_name_tha,
          s.email,
          u.username
        FROM certificate c
        INNER JOIN students s ON c.students_id = s.students_id
        INNER JOIN users u ON s.users_id = u.users_id
        WHERE c.activity_id = $1 
          AND c.status = 'Pass'
        ORDER BY c.uploaded_at DESC
        `,
        [activityId]
      );
      
      console.log("📥 [CertificateDao] Retrieved passed certificates for activity", { 
        activityId, 
        count: certificates.length 
      });
      return certificates;
    } catch (error) {
      this.logDbError("getPassedCertificatesByActivity", error);
      throw new Error("❌ Failed to retrieve passed certificates by activity");
    }
  }
}
