// src/daos/Student/certificate-verification.dao.ts
import { DataSource } from "typeorm";
import { CertificateBase } from "../../entity/certificate/certificate-base.entity";
import { CertificateVerification } from "../../entity/certificate/certificate-verification.entity";
import { CertificateAudit } from "../../entity/certificate/certificate-audit.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class CertificateVerificationDAO extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing CertificateVerificationDAO...");
      this.dataSource = await connectDatabase();
      console.log("✅ CertificateVerificationDAO initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize CertificateVerificationDAO:", error);
      this.logDbError("initialize", error);
      throw error;
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.dataSource?.isConnected) {
      console.log(
        "🔄 Database connection not established, attempting to initialize..."
      );
      try {
        await this.initialize();
      } catch (error) {
        throw new Error(`❌ Database connection is not established: ${error}`);
      }
    }
  }

  // ✅ ดึง CertificateBase ของกิจกรรม
  public async getCertificateBaseByActivityId(activityId: number): Promise<CertificateBase | null> {
    await this.checkConnection();
    try {
      console.log("🔍 [CertificateVerificationDAO] Getting certificate base for activity:", activityId);
      
      const certificateBase = await this.dataSource!
        .getRepository(CertificateBase)
        .findOne({
          where: { activity_id: activityId }
        });
      
      if (!certificateBase) {
        console.log("⚠️ [CertificateVerificationDAO] No certificate base found for activity:", activityId);
        return null;
      }
      
      console.log("✅ [CertificateVerificationDAO] Certificate base found:", {
        certificate_base_id: certificateBase.certificate_base_id,
        certificate_name: certificateBase.certificate_name,
        has_ocr_data: !!certificateBase.ocr_data,
        has_image_analysis: !!certificateBase.image_analysis
      });
      
      return certificateBase;
    } catch (error) {
      this.logDbError("getCertificateBaseByActivityId", error);
      throw new Error("❌ Failed to get certificate base");
    }
  }

  // ✅ บันทึกผลการตรวจสอบ
  public async saveVerificationResult(
    certificateId: number,
    verificationData: {
      isAuthentic: boolean;
      confidenceScore: number;
      matchedFeatures: string[];
      failedFeatures: string[];
      recommendations: string[];
      courseNameMatch: number;
      instructorMatch: number;
      visualMatch: number;
      formatMatch: number;
    }
  ): Promise<CertificateVerification> {
    await this.checkConnection();
    try {
      console.log("💾 [CertificateVerificationDAO] Saving verification result for certificate:", certificateId);
      
      const verification = new CertificateVerification();
      verification.certificate_id = certificateId;
      verification.verification_results = {
        isAuthentic: verificationData.isAuthentic,
        confidenceScore: verificationData.confidenceScore,
        matchedFeatures: verificationData.matchedFeatures,
        failedFeatures: verificationData.failedFeatures,
        recommendations: verificationData.recommendations
      };
      verification.visual_analysis = {
        backgroundMatch: verificationData.visualMatch,
        logoMatch: verificationData.visualMatch,
        watermarkMatch: verificationData.visualMatch,
        signatureMatch: verificationData.visualMatch,
        layoutMatch: verificationData.visualMatch
      };
      verification.content_analysis = {
        fieldCompleteness: verificationData.formatMatch,
        formatConsistency: verificationData.formatMatch,
        dataValidity: verificationData.confidenceScore,
        textQuality: verificationData.confidenceScore
      };
      verification.security_analysis = {
        qrCodeValid: verificationData.isAuthentic,
        securityElementsPresent: verificationData.matchedFeatures,
        securityElementsMissing: verificationData.failedFeatures,
        tamperingDetected: !verificationData.isAuthentic
      };
      verification.verification_method = "OCR";
      
      const savedVerification = await this.dataSource!.getRepository(CertificateVerification).save(verification);
      
      console.log("✅ [CertificateVerificationDAO] Verification result saved:", savedVerification.verification_id);
      return savedVerification;
    } catch (error) {
      this.logDbError("saveVerificationResult", error);
      throw new Error("❌ Failed to save verification result");
    }
  }

  // ✅ บันทึก Audit Log
  public async logCertificateAction(
    certificateId: number,
    action: string,
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null,
    performedBy: string,
    reason?: string
  ): Promise<CertificateAudit> {
    await this.checkConnection();
    try {
      console.log("📝 [CertificateVerificationDAO] Logging certificate action:", {
        certificateId,
        action,
        performedBy
      });
      
      const audit = new CertificateAudit();
      audit.certificate_id = certificateId;
      audit.action = action;
      audit.old_values = oldValues ? JSON.stringify(oldValues) : null;
      audit.new_values = newValues ? JSON.stringify(newValues) : null;
      audit.performed_by = performedBy;
      audit.reason = reason;
      
      const savedAudit = await this.dataSource!.getRepository(CertificateAudit).save(audit);
      
      console.log("✅ [CertificateVerificationDAO] Audit log saved:", savedAudit.audit_id);
      return savedAudit;
    } catch (error) {
      this.logDbError("logCertificateAction", error);
      throw new Error("❌ Failed to log certificate action");
    }
  }

  // ✅ ดึงประวัติการตรวจสอบ
  public async getVerificationHistory(certificateId: number): Promise<CertificateVerification[]> {
    await this.checkConnection();
    try {
      console.log("📚 [CertificateVerificationDAO] Getting verification history for certificate:", certificateId);
      
      const verifications = await this.dataSource!
        .getRepository(CertificateVerification)
        .find({
          where: { certificate_id: certificateId },
          order: { verified_at: 'DESC' }
        });
      
      console.log(`✅ [CertificateVerificationDAO] Found ${verifications.length} verification records`);
      return verifications;
    } catch (error) {
      this.logDbError("getVerificationHistory", error);
      throw new Error("❌ Failed to get verification history");
    }
  }

  // ✅ ดึง Audit History
  public async getAuditHistory(certificateId: number): Promise<CertificateAudit[]> {
    await this.checkConnection();
    try {
      console.log("📋 [CertificateVerificationDAO] Getting audit history for certificate:", certificateId);
      
      const audits = await this.dataSource!
        .getRepository(CertificateAudit)
        .find({
          where: { certificate_id: certificateId },
          order: { performed_at: 'DESC' }
        });
      
      console.log(`✅ [CertificateVerificationDAO] Found ${audits.length} audit records`);
      return audits;
    } catch (error) {
      this.logDbError("getAuditHistory", error);
      throw new Error("❌ Failed to get audit history");
    }
  }

  // ✅ ดึงข้อมูลนิสิต
  public async getStudentData(userId: number): Promise<{
    id: number;
    first_name_eng: string;
    last_name_eng: string;
  } | null> {
    await this.checkConnection();
    try {
      console.log("🔍 [CertificateVerificationDAO] Getting student data for userId:", userId);
      
      // ✅ JOIN ระหว่าง users และ students tables
      const query = `
        SELECT s.students_id as id, s.first_name_eng, s.last_name_eng 
        FROM users u
        INNER JOIN students s ON u.users_id = s.users_id
        WHERE u.users_id = $1 AND u.roles_id = 3
      `;
      
      console.log("🔍 [CertificateVerificationDAO] SQL Query:", query);
      console.log("🔍 [CertificateVerificationDAO] Query params:", [userId]);
      
      const result = await this.dataSource!.query(query, [userId]);
      console.log("🔍 [CertificateVerificationDAO] Query result:", result);
      
      if (result && result.length > 0) {
        console.log("✅ [CertificateVerificationDAO] Student found:", result[0]);
        return result[0];
      } else {
        console.log("❌ [CertificateVerificationDAO] No student found");
        return null;
      }
    } catch (error) {
      this.logDbError("getStudentData", error);
      throw new Error("❌ Failed to get student data");
    }
  }

  // ✅ ดึงข้อมูล activity
  public async getActivityData(activityId: number): Promise<{
    type: 'Soft' | 'Hard';
    recieve_hours: number;
  } | null> {
    await this.checkConnection();
    try {
      console.log("🔍 [CertificateVerificationDAO] Getting activity data for activityId:", activityId);
      
      const query = `
        SELECT type, recieve_hours 
        FROM activity 
        WHERE activity_id = $1 AND status = 'Active'
      `;
      
      const result = await this.dataSource!.query(query, [activityId]);
      
      if (result && result.length > 0) {
        console.log("✅ [CertificateVerificationDAO] Activity found:", result[0]);
        return result[0];
      } else {
        console.log("❌ [CertificateVerificationDAO] No activity found");
        return null;
      }
    } catch (error) {
      this.logDbError("getActivityData", error);
      throw new Error("❌ Failed to get activity data");
    }
  }

  // ✅ เพิ่ม soft hours
  public async addSoftHours(studentId: number, hours: number): Promise<void> {
    await this.checkConnection();
    try {
      console.log("🔍 [CertificateVerificationDAO] Adding soft hours:", { studentId, hours });
      
      // ✅ ดึงข้อมูลก่อน update
      const beforeQuery = `
        SELECT soft_hours, hard_hours, first_name_eng, last_name_eng 
        FROM students 
        WHERE students_id = $1
      `;
      const beforeResult = await this.dataSource!.query(beforeQuery, [studentId]);
      const beforeHours = beforeResult[0]?.soft_hours || 0;
      const studentName = `${beforeResult[0]?.first_name_eng || ''} ${beforeResult[0]?.last_name_eng || ''}`.trim();
      
      console.log("📊 [CertificateVerificationDAO] Student hours before update:", {
        studentId,
        studentName,
        currentSoftHours: beforeHours,
        addingHours: hours,
        newSoftHours: beforeHours + hours
      });
      
      const query = `
        UPDATE students 
        SET soft_hours = COALESCE(soft_hours, 0) + $2 
        WHERE students_id = $1
      `;
      
      await this.dataSource!.query(query, [studentId, hours]);
      
      // ✅ ดึงข้อมูลหลัง update
      const afterResult = await this.dataSource!.query(beforeQuery, [studentId]);
      const afterHours = afterResult[0]?.soft_hours || 0;
      
      console.log("✅ [CertificateVerificationDAO] Soft hours updated successfully:", {
        studentId,
        studentName,
        previousSoftHours: beforeHours,
        addedHours: hours,
        newSoftHours: afterHours,
        totalSoftHours: afterHours
      });
      
      console.log("🎉 [CertificateVerificationDAO] Student profile updated - Soft Skills hours increased!");
    } catch (error) {
      this.logDbError("addSoftHours", error);
      throw new Error("❌ Failed to add soft hours");
    }
  }

  // ✅ เพิ่ม hard hours
  public async addHardHours(studentId: number, hours: number): Promise<void> {
    await this.checkConnection();
    try {
      console.log("🔍 [CertificateVerificationDAO] Adding hard hours:", { studentId, hours });
      
      // ✅ ดึงข้อมูลก่อน update
      const beforeQuery = `
        SELECT soft_hours, hard_hours, first_name_eng, last_name_eng 
        FROM students 
        WHERE students_id = $1
      `;
      const beforeResult = await this.dataSource!.query(beforeQuery, [studentId]);
      const beforeHours = beforeResult[0]?.hard_hours || 0;
      const studentName = `${beforeResult[0]?.first_name_eng || ''} ${beforeResult[0]?.last_name_eng || ''}`.trim();
      
      console.log("📊 [CertificateVerificationDAO] Student hours before update:", {
        studentId,
        studentName,
        currentHardHours: beforeHours,
        addingHours: hours,
        newHardHours: beforeHours + hours
      });
      
      const query = `
        UPDATE students 
        SET hard_hours = COALESCE(hard_hours, 0) + $2 
        WHERE students_id = $1
      `;
      
      await this.dataSource!.query(query, [studentId, hours]);
      
      // ✅ ดึงข้อมูลหลัง update
      const afterResult = await this.dataSource!.query(beforeQuery, [studentId]);
      const afterHours = afterResult[0]?.hard_hours || 0;
      
      console.log("✅ [CertificateVerificationDAO] Hard hours updated successfully:", {
        studentId,
        studentName,
        previousHardHours: beforeHours,
        addedHours: hours,
        newHardHours: afterHours,
        totalHardHours: afterHours
      });
      
      console.log("🎉 [CertificateVerificationDAO] Student profile updated - Hard Skills hours increased!");
    } catch (error) {
      this.logDbError("addHardHours", error);
      throw new Error("❌ Failed to add hard hours");
    }
  }

  // ✅ เพิ่ม activity เข้าไปในกิจกรรมของนิสิต
  // ✅ ลบ method นี้เพราะไม่จำเป็น - certificate table เก็บ activity_id อยู่แล้ว
}