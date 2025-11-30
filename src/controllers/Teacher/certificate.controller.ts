import { Request, Response } from "express";
import { CertificateService } from "../../services/Teacher/certificate.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";

export class CertificateController extends ErrorHandledController {
  constructor(private readonly certificateService: CertificateService) {
    super();
  }

  private sanitize(input: any): string {
    return xss(input);
  }

  // ==================== CERTIFICATE TEMPLATE METHODS ====================

  /**
   * สร้าง Certificate Template สำหรับ Activity
   */
  public async createActivityCertificateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const file = req.file;
      const { description } = req.body;
      
      console.log("🏗️ [CertificateController] Creating certificate template for activity:", activityId);
      console.log("📁 [CertificateController] File details:", {
        filename: file?.originalname,
        mimetype: file?.mimetype,
        size: file?.size,
        hasBuffer: !!file?.buffer,
        bufferType: typeof file?.buffer,
        bufferLength: file?.buffer?.length || 'undefined'
      });
      console.log("📝 [CertificateController] Description:", description);
      
      if (!file) {
        console.log("❌ [CertificateController] No file provided");
        res.status(400).json({
          success: false,
          message: "Certificate file is required"
        });
        return;
      }

      // ✅ ตรวจสอบว่า file.buffer มีอยู่จริง
      if (!file.buffer) {
        console.log("❌ [CertificateController] File buffer is undefined");
        res.status(400).json({
          success: false,
          message: "File buffer is undefined. Please check multer configuration."
        });
        return;
      }

      console.log("🚀 [CertificateController] Calling certificate service...");
      const result = await this.certificateService.createActivityCertificateTemplate(
        activityId,
        {
          buffer: file.buffer,
          filename: file.originalname,
          mimetype: file.mimetype
        },
        description
      );
      
      console.log("✅ [CertificateController] Certificate template created successfully:", {
        activity_id: activityId,
        template_url: result?.certificate_template_url,
        has_ocr_data: !!result?.certificate_ocr_data,
        has_image_analysis: !!result?.certificate_image_analysis
      });
      
      res.status(201).json({
        success: true,
        message: "Activity certificate template created successfully",
        data: result
      });
    } catch (error) {
      console.error("❌ [CertificateController] Error creating certificate template:", error);
      this.handleError("CertificateController.createActivityCertificateTemplate", error, res);
    }
  }

  /**
   * Re-parse THAI MOOC data from existing certificate_base
   */
  public async reparseCertificateBase(req: Request, res: Response): Promise<void> {
    try {
      const certificateBaseId = this.parseId(req.params.certificateBaseId);
      
      console.log("🔄 [CertificateController] Re-parsing certificate base:", certificateBaseId);
      
      const result = await this.certificateService.reparseCertificateBase(certificateBaseId);
      
      console.log("✅ [CertificateController] Certificate base re-parsed successfully:", {
        certificate_base_id: certificateBaseId,
        certificate_type: result?.certificate_type,
        organize_base_name: result?.organize_base_name
      });
      
      res.status(200).json({
        success: true,
        message: "Certificate base re-parsed successfully",
        data: result
      });
    } catch (error) {
      console.error("❌ [CertificateController] Error re-parsing certificate base:", error);
      this.handleError("CertificateController.reparseCertificateBase", error, res);
    }
  }

  /**
   * สร้าง Certificate Template ใหม่
   */
  public async createCertificateTemplate(req: Request, res: Response): Promise<void> {
    try {
      console.log("🏗️ [CertificateController] Creating certificate template");
      
      const data = req.body;
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!data.template_name || !data.issuer_organization) {
        res.status(400).json({
          success: false,
          message: "Template name and issuer organization are required"
        });
        return;
      }

      const template = await this.certificateService.createCertificateTemplate(data);
      
      res.status(201).json({
        success: true,
        message: "Certificate template created successfully",
        data: template
      });
    } catch (error) {
      this.handleError("CertificateController.createCertificateTemplate", error, res);
    }
  }

  /**
   * ดึง Certificate Template ทั้งหมด
   */
  public async getAllCertificateTemplates(req: Request, res: Response): Promise<void> {
    try {
      console.log("📥 [CertificateController] Getting all certificate templates");
      
      const templates = await this.certificateService.getAllCertificateTemplates();
      
      res.status(200).json({
        success: true,
        message: "Certificate templates retrieved successfully",
        data: templates,
        count: templates.length
      });
    } catch (error) {
      this.handleError("CertificateController.getAllCertificateTemplates", error, res);
    }
  }

  /**
   * ดึง Certificate Template โดย ID
   */
  public async getCertificateTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const templateId = this.parseId(req.params.id);
      console.log("🔍 [CertificateController] Getting certificate template by ID:", templateId);
      
      const template = await this.certificateService.getCertificateTemplateById(templateId);
      
      if (!template) {
        res.status(404).json({
          success: false,
          message: "Certificate template not found"
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: "Certificate template retrieved successfully",
        data: template
      });
    } catch (error) {
      this.handleError("CertificateController.getCertificateTemplateById", error, res);
    }
  }

  // ==================== CERTIFICATE METHODS ====================

  /**
   * สร้าง Certificate ใหม่
   */
  public async createCertificate(req: Request, res: Response): Promise<void> {
    try {
      console.log("📄 [CertificateController] Creating certificate");
      
      const data = req.body;
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!data.students_id) {
        res.status(400).json({
          success: false,
          message: "Student ID is required"
        });
        return;
      }

      const certificate = await this.certificateService.createCertificate(data);
      
      res.status(201).json({
        success: true,
        message: "Certificate created successfully",
        data: certificate
      });
    } catch (error) {
      this.handleError("CertificateController.createCertificate", error, res);
    }
  }

  /**
   * ดึง Certificate โดย ID
   */
  public async getCertificateById(req: Request, res: Response): Promise<void> {
    try {
      const certificateId = this.parseId(req.params.id);
      console.log("🔍 [CertificateController] Getting certificate by ID:", certificateId);
      
      const certificate = await this.certificateService.getCertificateById(certificateId);
      
      if (!certificate) {
        res.status(404).json({
          success: false,
          message: "Certificate not found"
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: "Certificate retrieved successfully",
        data: certificate
      });
    } catch (error) {
      this.handleError("CertificateController.getCertificateById", error, res);
    }
  }

  /**
   * ดึง Certificate ทั้งหมดของนิสิต
   */
  public async getCertificatesByStudentId(req: Request, res: Response): Promise<void> {
    try {
      const studentId = this.parseId(req.params.studentId);
      console.log("📥 [CertificateController] Getting certificates for student:", studentId);
      
      const certificates = await this.certificateService.getCertificatesByStudentId(studentId);
      
      res.status(200).json({
        success: true,
        message: "Certificates retrieved successfully",
        data: certificates,
        count: certificates.length
      });
    } catch (error) {
      this.handleError("CertificateController.getCertificatesByStudentId", error, res);
    }
  }

  /**
   * ดึง Certificate ของนิสิตตาม status
   */
  public async getCertificatesByStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string;
      const studentId = req.query.studentId ? this.parseId(req.query.studentId as string) : undefined;
      
      console.log("📥 [CertificateController] Getting certificates by status:", {
        status,
        studentId
      });
      
      // ตรวจสอบว่า status มีค่าหรือไม่
      if (!status) {
        res.status(400).json({
          success: false,
          message: "Status parameter is required"
        });
        return;
      }
      
      // ตรวจสอบว่า status เป็นค่าที่ถูกต้องหรือไม่
      const validStatuses = ['Pass', 'Pending'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }
      
      const certificates = await this.certificateService.getCertificatesByStatus(status, studentId);
      
      res.status(200).json({
        success: true,
        message: "Certificates retrieved successfully",
        data: certificates,
        count: certificates.length,
        status,
        studentId: studentId || 'all'
      });
    } catch (error) {
      this.handleError("CertificateController.getCertificatesByStatus", error, res);
    }
  }

  /**
   * อัปเดต Certificate
   */
  public async updateCertificate(req: Request, res: Response): Promise<void> {
    try {
      const certificateId = this.parseId(req.params.id);
      const data = req.body;
      console.log("🔧 [CertificateController] Updating certificate:", certificateId);
      
      const updatedCertificate = await this.certificateService.updateCertificate(certificateId, data);
      
      if (!updatedCertificate) {
        res.status(404).json({
          success: false,
          message: "Certificate not found"
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: "Certificate updated successfully",
        data: updatedCertificate
      });
    } catch (error) {
      this.handleError("CertificateController.updateCertificate", error, res);
    }
  }

  /**
   * ลบ Certificate ตาม ID
   */
  public async deleteCertificate(req: Request, res: Response): Promise<void> {
    try {
      const certificateId = this.parseId(req.params.id);
      console.log("🗑️ [CertificateController] Deleting certificate:", certificateId);
      
      const deleted = await this.certificateService.deleteCertificate(certificateId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Certificate not found"
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: "Certificate deleted successfully",
        data: { certificate_id: certificateId }
      });
    } catch (error) {
      this.handleError("CertificateController.deleteCertificate", error, res);
    }
  }

  /**
   * ตรวจสอบ Certificate
   */
  public async verifyCertificate(req: Request, res: Response): Promise<void> {
    try {
      const certificateId = this.parseId(req.params.id);
      const templateId = req.body.templateId ? parseInt(req.body.templateId) : undefined;
      const file = req.file;
      
      console.log("🔍 [CertificateController] Verifying certificate:", certificateId);
      
      if (!file) {
        res.status(400).json({
          success: false,
          message: "Certificate file is required"
        });
        return;
      }

      const verification = await this.certificateService.verifyCertificate(
        certificateId,
        {
          buffer: file.buffer,
          filename: file.originalname,
          mimetype: file.mimetype
        },
        templateId
      );
      
      res.status(200).json({
        success: true,
        message: "Certificate verification completed",
        data: verification
      });
    } catch (error) {
      this.handleError("CertificateController.verifyCertificate", error, res);
    }
  }

  /**
   * ดึง Certificate Verification โดย Certificate ID
   */
  public async getVerificationsByCertificateId(req: Request, res: Response): Promise<void> {
    try {
      const certificateId = this.parseId(req.params.certificateId);
      console.log("📥 [CertificateController] Getting verifications for certificate:", certificateId);
      
      const verifications = await this.certificateService.getVerificationsByCertificateId(certificateId);
      
      res.status(200).json({
        success: true,
        message: "Certificate verifications retrieved successfully",
        data: verifications,
        count: verifications.length
      });
    } catch (error) {
      this.handleError("CertificateController.getVerificationsByCertificateId", error, res);
    }
  }

  // ==================== CERTIFICATE AUDIT METHODS ====================

  /**
   * ดึง Certificate Audit โดย Certificate ID
   */
  public async getAuditsByCertificateId(req: Request, res: Response): Promise<void> {
    try {
      const certificateId = this.parseId(req.params.certificateId);
      console.log("📥 [CertificateController] Getting audits for certificate:", certificateId);
      
      const audits = await this.certificateService.getAuditsByCertificateId(certificateId);
      
      res.status(200).json({
        success: true,
        message: "Certificate audits retrieved successfully",
        data: audits,
        count: audits.length
      });
    } catch (error) {
      this.handleError("CertificateController.getAuditsByCertificateId", error, res);
    }
  }

  // ==================== CERTIFICATE BASE METHODS ====================

  /**
   * สร้าง Certificate Base ใหม่
   */
  public async createCertificateBase(req: Request, res: Response): Promise<void> {
    try {
      console.log("🏗️ [CertificateController] Creating certificate base");
      
      const data = req.body;
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!data.activity_id || !data.certificate_name || !data.certificate_source) {
        res.status(400).json({
          success: false,
          message: "Activity ID, certificate name, and certificate source are required"
        });
        return;
      }

      const base = await this.certificateService.createCertificateBase(data);
      
      res.status(201).json({
        success: true,
        message: "Certificate base created successfully",
        data: base
      });
    } catch (error) {
      this.handleError("CertificateController.createCertificateBase", error, res);
    }
  }

  /**
   * ดึง Certificate Base โดย Activity ID
   */
  public async getCertificateBaseByActivityId(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      console.log("🔍 [CertificateController] Getting certificate base for activity:", activityId);
      
      const base = await this.certificateService.getCertificateBaseByActivityId(activityId);
      
      if (!base) {
        res.status(404).json({
          success: false,
          message: "Certificate base not found"
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: "Certificate base retrieved successfully",
        data: base
      });
    } catch (error) {
      this.handleError("CertificateController.getCertificateBaseByActivityId", error, res);
    }
  }

  // ==================== ANALYTICS METHODS ====================

  /**
   * ดึงสถิติการตรวจสอบ Certificate
   */
  public async getCertificateVerificationStats(req: Request, res: Response): Promise<void> {
    try {
      console.log("📊 [CertificateController] Getting certificate verification statistics");
      
      const stats = await this.certificateService.getCertificateVerificationStats();
      
      res.status(200).json({
        success: true,
        message: "Certificate verification statistics retrieved successfully",
        data: stats
      });
    } catch (error) {
      this.handleError("CertificateController.getCertificateVerificationStats", error, res);
    }
  }

  /**
   * ดึง Certificate ที่รอการตรวจสอบ
   */
  public async getPendingCertificates(req: Request, res: Response): Promise<void> {
    try {
      console.log("⏳ [CertificateController] Getting pending certificates");
      
      const certificates = await this.certificateService.getPendingCertificates();
      
      res.status(200).json({
        success: true,
        message: "Pending certificates retrieved successfully",
        data: certificates,
        count: certificates.length
      });
    } catch (error) {
      this.handleError("CertificateController.getPendingCertificates", error, res);
    }
  }

  /**
   * ดึง Certificate ที่ผ่านการตรวจสอบตาม activity_id
   */
  public async getPassedCertificatesByActivity(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      console.log("📥 [CertificateController] Getting passed certificates for activity:", activityId);
      
      const certificates = await this.certificateService.getPassedCertificatesByActivity(activityId);
      
      res.status(200).json({
        success: true,
        message: "Passed certificates retrieved successfully",
        data: certificates,
        count: certificates.length
      });
    } catch (error) {
      this.handleError("CertificateController.getPassedCertificatesByActivity", error, res);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Parse ID จาก parameters
   */
  private parseId(value: string): number {
    console.log(`🔍 parseId: Received value: "${value}", type: ${typeof value}`);
    
    if (typeof value !== 'string' || value.trim() === '') {
      console.error(`❌ parseId: Invalid value type or empty: ${value}`);
      throw new Error("Invalid ID format: Value must be a non-empty string");
    }
    
    const cleanValue = value.trim();
    if (!/^\d+$/.test(cleanValue)) {
      console.error(`❌ parseId: Value contains non-numeric characters: "${cleanValue}"`);
      throw new Error(`Invalid ID format: "${cleanValue}" is not a valid number`);
    }
    
    const id = parseInt(cleanValue, 10);
    if (isNaN(id)) {
      console.error(`❌ parseId: parseInt failed for value: "${cleanValue}"`);
      throw new Error("Invalid ID format: Failed to parse number");
    }
    
    console.log(`✅ parseId: Successfully parsed ID: ${id}`);
    return id;
  }
}

const certificateService = new CertificateService();
const controller = new CertificateController(certificateService);

export const certificateController = {
  // Certificate Template methods
  createActivityCertificateTemplate: controller.createActivityCertificateTemplate.bind(controller),
  createCertificateTemplate: controller.createCertificateTemplate.bind(controller),
  getAllCertificateTemplates: controller.getAllCertificateTemplates.bind(controller),
  getCertificateTemplateById: controller.getCertificateTemplateById.bind(controller),
  reparseCertificateBase: controller.reparseCertificateBase.bind(controller),
  
  // Certificate methods
  createCertificate: controller.createCertificate.bind(controller),
  getCertificateById: controller.getCertificateById.bind(controller),
  getCertificatesByStudentId: controller.getCertificatesByStudentId.bind(controller),
  getCertificatesByStatus: controller.getCertificatesByStatus.bind(controller),
  updateCertificate: controller.updateCertificate.bind(controller),
  deleteCertificate: controller.deleteCertificate.bind(controller),
  verifyCertificate: controller.verifyCertificate.bind(controller),
  getVerificationsByCertificateId: controller.getVerificationsByCertificateId.bind(controller),
  
  // Certificate Audit methods
  getAuditsByCertificateId: controller.getAuditsByCertificateId.bind(controller),
  
  // Certificate Base methods
  createCertificateBase: controller.createCertificateBase.bind(controller),
  getCertificateBaseByActivityId: controller.getCertificateBaseByActivityId.bind(controller),
  
  // Analytics methods
  getCertificateVerificationStats: controller.getCertificateVerificationStats.bind(controller),
  getPendingCertificates: controller.getPendingCertificates.bind(controller),
  
  // Additional methods
  getPassedCertificatesByActivity: controller.getPassedCertificatesByActivity.bind(controller),
};


