import { CertificateDao } from "../../daos/Teacher/certificate.dao";
import { Certificate } from "../../entity/certificate/certificate.entity";
import { CertificateTemplate } from "../../entity/certificate/certificate-template.entity";
import { CertificateVerification } from "../../entity/certificate/certificate-verification.entity";
import { CertificateAudit } from "../../entity/certificate/certificate-audit.entity";
import { CertificateBase } from "../../entity/certificate/certificate-base.entity";
import { ErrorHandledService } from "../error.handdled.service";
import { callTyphoonOCR } from "../Student/ocr.service";
import { imageAnalyzer } from "../../utils/imageAnalysis";
import sharp from "sharp";
import cloudinary from "../../utils/cloudinary";

export class CertificateService extends ErrorHandledService {
  private readonly certificateDao = new CertificateDao();

  // ==================== CERTIFICATE TEMPLATE METHODS ====================

  /**
   * สร้าง Certificate Template สำหรับ Activity
   */
  public async createActivityCertificateTemplate(
    activityId: number,
    file: { buffer: Buffer; filename: string; mimetype?: string },
    description?: string
  ): Promise<any> {
    try {
      console.log("🏗️ [CertificateService] Creating certificate template for activity:", activityId);
      console.log("📁 [CertificateService] File info:", {
        filename: file.filename,
        mimetype: file.mimetype,
        buffer_size: file.buffer ? file.buffer.length : 'undefined'
      });
      
      // ✅ ตรวจสอบว่า file.buffer มีอยู่จริงหรือไม่
      if (!file.buffer) {
        throw new Error("File buffer is undefined. Please check multer configuration.");
      }
      console.log("📝 [CertificateService] Description:", description);
      
      // 1. อัปโหลดไฟล์ไปยัง Cloudinary
      console.log("☁️ [CertificateService] Step 1: Uploading to Cloudinary...");
      const cloudinaryUrl = await this.uploadToCloudinary(file);
      console.log("✅ [CertificateService] Cloudinary upload successful:", cloudinaryUrl);
      
      // 2. ทำ OCR และ Image Analysis
      console.log("🔍 [CertificateService] Step 2: Performing OCR...");
      const ocrResult = await this.performOCR(file);
      console.log("📄 [CertificateService] OCR result:", {
        has_course_name: !!ocrResult?.course_name,
        has_instructor_name: !!ocrResult?.instructor_name,
        has_university_name: !!ocrResult?.university_name,
        raw_text_length: ocrResult?.rawText?.length || 0
      });
      
      console.log("🖼️ [CertificateService] Step 3: Analyzing image...");
      const imageAnalysis = await this.analyzeImage(file.buffer);
      console.log("🎨 [CertificateService] Image analysis result:", {
        has_dominant_colors: !!imageAnalysis?.dominantColors,
        has_logo_position: !!imageAnalysis?.logoPosition,
        has_watermark: !!imageAnalysis?.watermark,
        has_signature: !!imageAnalysis?.signature,
        has_layout: !!imageAnalysis?.layout
      });
      
      // 3. สร้าง Certificate Template ใน database และเชื่อมกับ Activity
      console.log("💾 [CertificateService] Step 4: Creating certificate template in database...");
      const result = await this.certificateDao.createActivityCertificateTemplate(
        activityId,
        {
          template_url: cloudinaryUrl,
          ocr_data: ocrResult,
          image_analysis: imageAnalysis,
          description: description || null
        }
      );
      
      console.log("✅ [CertificateService] Certificate template created successfully:", {
        template_id: result?.template_id,
        activity_id: result?.activity_id,
        template_url: result?.template_url,
        description: result?.description
      });
      
      this.logInfo("✅ [CertificateService] Activity certificate template created", { 
        activity_id: activityId,
        template_url: cloudinaryUrl
      });
      
      // ✅ Return data ในรูปแบบที่ frontend คาดหวัง (backward compatible)
      return {
        activity_id: activityId,
        certificate_template_url: cloudinaryUrl,
        certificate_ocr_data: ocrResult,
        certificate_image_analysis: imageAnalysis,
        upload_certificate_description: description || null,
        template_id: result.template_id,
        template_name: result.template_name
      };
    } catch (error) {
      console.error("❌ [CertificateService] Error creating activity certificate template:", error);
      this.logError("❌ Error creating activity certificate template", error);
      throw error;
    }
  }

  /**
   * Re-parse THAI MOOC data from existing certificate_base
   */
  public async reparseCertificateBase(certificateBaseId: number): Promise<any> {
    try {
      console.log("🔄 [CertificateService] Re-parsing certificate base:", certificateBaseId);
      
      const result = await this.certificateDao.reparseCertificateBase(certificateBaseId);
      
      this.logInfo("✅ [CertificateService] Certificate base re-parsed", { 
        certificate_base_id: certificateBaseId 
      });
      
      return result;
    } catch (error) {
      this.logError("❌ Error re-parsing certificate base", error);
      throw error;
    }
  }

  /**
   * สร้าง Certificate Template ใหม่
   */
  public async createCertificateTemplate(data: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
    try {
      console.log("🏗️ [CertificateService] Creating certificate template:", data.template_name);
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!data.template_name || !data.issuer_organization) {
        throw new Error("Template name and issuer organization are required");
      }

      const template = await this.certificateDao.createCertificateTemplate(data);
      
      this.logInfo("✅ [CertificateService] Certificate template created", { 
        template_id: template.template_id 
      });
      
      return template;
    } catch (error) {
      this.logError("❌ Error creating certificate template", error);
      throw error;
    }
  }

  /**
   * ดึง Certificate Template ทั้งหมด
   */
  public async getAllCertificateTemplates(): Promise<CertificateBase[]> {
    try {
      console.log("📥 [CertificateService] Getting all certificate templates");
      
      const templates = await this.certificateDao.getAllCertificateTemplates();
      
      this.logInfo("📥 [CertificateService] Retrieved certificate templates", { 
        count: templates.length 
      });
      
      return templates;
    } catch (error) {
      this.logError("❌ Error getting certificate templates", error);
      throw error;
    }
  }

  /**
   * ดึง Certificate Template โดย ID
   */
  public async getCertificateTemplateById(templateId: number): Promise<CertificateTemplate | null> {
    try {
      console.log("🔍 [CertificateService] Getting certificate template by ID:", templateId);
      
      const template = await this.certificateDao.getCertificateTemplateById(templateId);
      
      return template;
    } catch (error) {
      this.logError("❌ Error getting certificate template by ID", error);
      throw error;
    }
  }

  // ==================== CERTIFICATE METHODS ====================

  /**
   * สร้าง Certificate ใหม่
   */
  public async createCertificate(data: Partial<Certificate>): Promise<Certificate> {
    try {
      console.log("📄 [CertificateService] Creating certificate for student:", data.students_id);
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!data.students_id) {
        throw new Error("Student ID is required");
      }

      const certificate = await this.certificateDao.createCertificate(data);
      
      // สร้าง Audit Log
      await this.createAuditLog(certificate.certificate_id, "UPLOAD", null, {
        status: certificate.status,
        uploaded_at: certificate.uploaded_at
      }, "system");
      
      this.logInfo("✅ [CertificateService] Certificate created", { 
        certificate_id: certificate.certificate_id 
      });
      
      return certificate;
    } catch (error) {
      this.logError("❌ Error creating certificate", error);
      throw error;
    }
  }

  /**
   * ดึง Certificate โดย ID
   */
  public async getCertificateById(certificateId: number): Promise<Certificate | null> {
    try {
      console.log("🔍 [CertificateService] Getting certificate by ID:", certificateId);
      
      const certificate = await this.certificateDao.getCertificateById(certificateId);
      
      return certificate;
    } catch (error) {
      this.logError("❌ Error getting certificate by ID", error);
      throw error;
    }
  }

  /**
   * ดึง Certificate ทั้งหมดของนิสิต
   */
  public async getCertificatesByStudentId(studentId: number): Promise<Certificate[]> {
    try {
      console.log("📥 [CertificateService] Getting certificates for student:", studentId);
      
      const certificates = await this.certificateDao.getCertificatesByStudentId(studentId);
      
      this.logInfo("📥 [CertificateService] Retrieved certificates by student", { 
        studentId, 
        count: certificates.length 
      });
      
      return certificates;
    } catch (error) {
      this.logError("❌ Error getting certificates by student", error);
      throw error;
    }
  }

  /**
   * อัปเดต Certificate
   */
  public async updateCertificate(certificateId: number, data: Partial<Certificate>): Promise<Certificate | null> {
    try {
      console.log("🔧 [CertificateService] Updating certificate:", certificateId);
      
      const oldCertificate = await this.certificateDao.getCertificateById(certificateId);
      if (!oldCertificate) {
        throw new Error("Certificate not found");
      }

      const updatedCertificate = await this.certificateDao.updateCertificate(certificateId, data);
      
      // สร้าง Audit Log
      await this.createAuditLog(certificateId, "UPDATE", oldCertificate, updatedCertificate, "system");
      
      this.logInfo("✅ [CertificateService] Certificate updated", { 
        certificate_id: certificateId 
      });
      
      return updatedCertificate;
    } catch (error) {
      this.logError("❌ Error updating certificate", error);
      throw error;
    }
  }

  // ==================== CERTIFICATE VERIFICATION METHODS ====================

  /**
   * ตรวจสอบ Certificate ด้วย OCR และ Template Matching
   */
  public async verifyCertificate(
    certificateId: number, 
    file: { buffer: Buffer; filename: string; mimetype?: string },
    templateId?: number
  ): Promise<CertificateVerification> {
    try {
      console.log("🔍 [CertificateService] Verifying certificate:", certificateId);
      
      const certificate = await this.certificateDao.getCertificateById(certificateId);
      if (!certificate) {
        throw new Error("Certificate not found");
      }

      // 1. ทำ OCR
      const ocrResult = await this.performOCR(file);
      
      // 2. เปรียบเทียบกับ Template (ถ้ามี)
      let templateComparison = null;
      if (templateId) {
        const template = await this.certificateDao.getCertificateTemplateById(templateId);
        if (template) {
          templateComparison = await this.compareWithTemplate(ocrResult, template, file.buffer);
        }
      }

      // 3. คำนวณ Confidence Score
      const confidenceScore = this.calculateConfidenceScore(ocrResult, templateComparison);
      
      // 4. สร้าง Verification Result
      const verificationData: Partial<CertificateVerification> = {
        certificate_id: certificateId,
        template_id: templateId,
        verification_results: {
          isAuthentic: confidenceScore >= 70, // กำหนด threshold
          confidenceScore,
          matchedFeatures: templateComparison?.matchedFeatures || [],
          failedFeatures: templateComparison?.failedFeatures || [],
          recommendations: this.generateRecommendations(ocrResult, templateComparison, confidenceScore)
        },
        visual_analysis: {
          backgroundMatch: templateComparison?.visualAnalysis?.backgroundMatch || 0,
          logoMatch: templateComparison?.visualAnalysis?.logoMatch || 0,
          watermarkMatch: templateComparison?.visualAnalysis?.watermarkMatch || 0,
          signatureMatch: templateComparison?.visualAnalysis?.signatureMatch || 0,
          layoutMatch: templateComparison?.visualAnalysis?.layoutMatch || 0
        },
        content_analysis: {
          fieldCompleteness: this.calculateFieldCompleteness(ocrResult),
          formatConsistency: this.calculateFormatConsistency(ocrResult),
          dataValidity: this.calculateDataValidity(ocrResult),
          textQuality: this.calculateTextQuality(ocrResult)
        },
        security_analysis: {
          qrCodeValid: this.checkQRCodeValidity(ocrResult),
          securityElementsPresent: this.checkSecurityElements(ocrResult),
          securityElementsMissing: templateComparison?.missingSecurityElements || [],
          tamperingDetected: this.detectTampering(ocrResult)
        },
        verification_method: templateId ? "Hybrid" : "OCR"
      };

      const verification = await this.certificateDao.createCertificateVerification(verificationData);
      
      // 5. อัปเดต Certificate status
      const newStatus = confidenceScore >= 70 ? "Pass" : "Fail";
      await this.certificateDao.updateCertificate(certificateId, {
        status: newStatus,
        verification_metadata: {
          lastVerified: new Date(),
          verificationCount: (certificate.verification_metadata?.verificationCount || 0) + 1,
          confidenceScore,
          verificationStatus: newStatus
        }
      });

      // 6. สร้าง Audit Log
      await this.createAuditLog(certificateId, "VERIFY", { status: certificate.status }, { status: newStatus }, "system");
      
      this.logInfo("✅ [CertificateService] Certificate verification completed", { 
        certificate_id: certificateId,
        confidence_score: confidenceScore,
        is_authentic: verificationData.verification_results?.isAuthentic
      });
      
      return verification;
    } catch (error) {
      this.logError("❌ Error verifying certificate", error);
      throw error;
    }
  }

  /**
   * ดึง Certificate Verification โดย Certificate ID
   */
  public async getVerificationsByCertificateId(certificateId: number): Promise<CertificateVerification[]> {
    try {
      console.log("📥 [CertificateService] Getting verifications for certificate:", certificateId);
      
      const verifications = await this.certificateDao.getVerificationsByCertificateId(certificateId);
      
      return verifications;
    } catch (error) {
      this.logError("❌ Error getting certificate verifications", error);
      throw error;
    }
  }

  // ==================== CERTIFICATE AUDIT METHODS ====================

  /**
   * สร้าง Audit Log
   */
  public async createAuditLog(
    certificateId: number, 
    action: string, 
    oldValues: any, 
    newValues: any, 
    performedBy: string,
    reason?: string
  ): Promise<CertificateAudit> {
    try {
      const auditData: Partial<CertificateAudit> = {
        certificate_id: certificateId,
        action,
        old_values: oldValues,
        new_values: newValues,
        reason,
        performed_by: performedBy
      };

      const audit = await this.certificateDao.createCertificateAudit(auditData);
      
      this.logInfo("📝 [CertificateService] Audit log created", { 
        audit_id: audit.audit_id,
        action 
      });
      
      return audit;
    } catch (error) {
      this.logError("❌ Error creating audit log", error);
      throw error;
    }
  }

  /**
   * ดึง Certificate Audit โดย Certificate ID
   */
  public async getAuditsByCertificateId(certificateId: number): Promise<CertificateAudit[]> {
    try {
      console.log("📥 [CertificateService] Getting audits for certificate:", certificateId);
      
      const audits = await this.certificateDao.getAuditsByCertificateId(certificateId);
      
      return audits;
    } catch (error) {
      this.logError("❌ Error getting certificate audits", error);
      throw error;
    }
  }

  // ==================== CERTIFICATE BASE METHODS ====================

  /**
   * สร้าง Certificate Base ใหม่
   */
  public async createCertificateBase(data: Partial<CertificateBase>): Promise<CertificateBase> {
    try {
      console.log("🏗️ [CertificateService] Creating certificate base for activity:", data.activity_id);
      
      const base = await this.certificateDao.createCertificateBase(data);
      
      this.logInfo("✅ [CertificateService] Certificate base created", { 
        certificate_base_id: base.certificate_base_id 
      });
      
      return base;
    } catch (error) {
      this.logError("❌ Error creating certificate base", error);
      throw error;
    }
  }

  /**
   * ดึง Certificate Base โดย Activity ID
   */
  public async getCertificateBaseByActivityId(activityId: number): Promise<CertificateBase | null> {
    try {
      console.log("🔍 [CertificateService] Getting certificate base for activity:", activityId);
      
      const base = await this.certificateDao.getCertificateBaseByActivityId(activityId);
      
      return base;
    } catch (error) {
      this.logError("❌ Error getting certificate base by activity", error);
      throw error;
    }
  }

  // ==================== ANALYTICS METHODS ====================

  /**
   * ดึงสถิติการตรวจสอบ Certificate
   */
  public async getCertificateVerificationStats(): Promise<any> {
    try {
      console.log("📊 [CertificateService] Getting certificate verification statistics");
      
      const stats = await this.certificateDao.getCertificateVerificationStats();
      
      return stats;
    } catch (error) {
      this.logError("❌ Error getting verification statistics", error);
      throw error;
    }
  }

  /**
   * ดึง Certificate ที่รอการตรวจสอบ
   */
  public async getPendingCertificates(): Promise<Certificate[]> {
    try {
      console.log("⏳ [CertificateService] Getting pending certificates");
      
      const certificates = await this.certificateDao.getPendingCertificates();
      
      return certificates;
    } catch (error) {
      this.logError("❌ Error getting pending certificates", error);
      throw error;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * อัปโหลดไฟล์ไปยัง Cloudinary
   */
  private async uploadToCloudinary(file: { buffer: Buffer; filename: string; mimetype?: string }): Promise<string> {
    try {
      console.log("☁️ [CertificateService] Uploading to Cloudinary");
      
      // ✅ ใช้ Cloudinary SDK แบบถูกต้อง (upload_stream สำหรับ Buffer)
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            upload_preset: "ceth-project",
            resource_type: "auto"
          },
          (error, result) => {
            if (error) {
              console.error("❌ [Cloudinary] Upload failed:", error);
              reject(error);
            } else if (result) {
              console.log("✅ [Cloudinary] Upload success:", result.secure_url);
              resolve(result.secure_url);
            } else {
              reject(new Error("Cloudinary upload failed: No result returned"));
            }
          }
        );
        
        // ส่ง Buffer ไปยัง upload stream
        uploadStream.end(file.buffer);
      });
    } catch (error) {
      this.logError("❌ Error uploading to Cloudinary", error);
      throw error;
    }
  }

  /**
   * วิเคราะห์รูปภาพ
   */
  private async analyzeImage(buffer: Buffer): Promise<any> {
    try {
      console.log("🔍 [CertificateService] Analyzing image");
      
      // วิเคราะห์สีพื้นหลัง
      const colors = await imageAnalyzer.analyzeDominantColors(buffer);
      
      // วิเคราะห์โลโก้
      const logoPos = await imageAnalyzer.detectLogoPosition(buffer);
      
      // ตรวจจับลายน้ำ
      const watermark = await imageAnalyzer.detectWatermark(buffer);
      
      // ตรวจจับลายเซ็น
      const signature = await imageAnalyzer.detectSignature(buffer);
      
      // วิเคราะห์ Layout
      const layout = await imageAnalyzer.analyzeLayout(buffer);
      
      return {
        dominantColors: colors,
        logoPosition: logoPos,
        watermark,
        signature,
        layout
      };
    } catch (error) {
      this.logError("❌ Error analyzing image", error);
      return {
        dominantColors: { dominant: "#FFFFFF", palette: ["#FFFFFF"] },
        logoPosition: { x: 0, y: 0, width: 0, height: 0 },
        watermark: { detected: false, confidence: 0 },
        signature: { detected: false, confidence: 0 },
        layout: { width: 0, height: 0, textRegions: 0, imageRegions: 0, emptySpaceRatio: 0 }
      };
    }
  }

  /**
   * ทำ OCR บนไฟล์ Certificate
   */
  private async performOCR(file: { buffer: Buffer; filename: string; mimetype?: string }): Promise<any> {
    try {
      console.log("🔍 [CertificateService] Performing OCR on certificate");
      
      const rawOcrResult = await callTyphoonOCR(file, {
        model: "typhoon-ocr-preview"
      });
      
      // ✅ Extract เฉพาะข้อมูลที่สำคัญจาก OCR result
      const extractedText = this.extractOCRText(rawOcrResult);
      
      console.log("📄 [CertificateService] Extracted OCR text:", {
        text_length: extractedText.natural_text?.length || 0,
        has_text: !!extractedText.natural_text
      });
      
      return {
        natural_text: extractedText.natural_text || "",
        extracted_fields: extractedText.extracted_fields || {},
        processing_time: rawOcrResult.processing_time || 0,
        total_pages: rawOcrResult.total_pages || 1,
        raw_response: rawOcrResult // เก็บไว้สำหรับ debug
      };
    } catch (error) {
      this.logError("❌ Error performing OCR", error);
      return {
        natural_text: "",
        extracted_fields: {},
        processing_time: 0,
        total_pages: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Extract ข้อความจาก OCR result
   */
  private extractOCRText(ocrResult: any): { natural_text: string; extracted_fields: any } {
    try {
      // ✅ ลอง parse จาก Typhoon OCR response structure
      if (ocrResult?.results && Array.isArray(ocrResult.results) && ocrResult.results.length > 0) {
        const firstResult = ocrResult.results[0];
        
        // ✅ ดึงข้อความจาก message.choices[0].message.content
        if (firstResult?.message?.choices?.[0]?.message?.content) {
          const content = firstResult.message.choices[0].message.content;
          
          // ✅ ถ้า content เป็น JSON string ให้ parse
          try {
            const parsed = JSON.parse(content);
            return {
              natural_text: parsed.natural_text || parsed.text || content,
              extracted_fields: parsed
            };
          } catch {
            // ถ้า parse ไม่ได้ก็ใช้ content ตรงๆ
            return {
              natural_text: content,
              extracted_fields: {}
            };
          }
        }
      }
      
      // ✅ Fallback: ถ้าไม่เจอข้อความ
      return {
        natural_text: "",
        extracted_fields: {}
      };
    } catch (error) {
      console.error("❌ [CertificateService] Error extracting OCR text:", error);
      return {
        natural_text: "",
        extracted_fields: {}
      };
    }
  }

  /**
   * เปรียบเทียบ OCR Result กับ Template
   */
  private async compareWithTemplate(
    ocrResult: any, 
    template: CertificateTemplate,
    imageBuffer: Buffer
  ): Promise<any> {
    try {
      console.log("🔍 [CertificateService] Comparing with template:", template.template_name);
      
      // 1. วิเคราะห์สีพื้นหลัง
      const colors = await imageAnalyzer.analyzeDominantColors(imageBuffer);
      const backgroundMatch = imageAnalyzer.compareBackgroundColor(
        colors.dominant,
        template.visual_features.backgroundColor
      );
      console.log(`🎨 Background match: ${backgroundMatch}%`);
      
      // 2. วิเคราะห์โลโก้
      const logoPos = await imageAnalyzer.detectLogoPosition(imageBuffer);
      const metadata = await sharp(imageBuffer).metadata();
      const logoMatch = imageAnalyzer.compareLogoPosition(
        logoPos,
        template.visual_features.logoPosition,
        { width: metadata.width || 0, height: metadata.height || 0 }
      );
      console.log(`🏢 Logo match: ${logoMatch}%`);
      
      // 3. ตรวจจับลายน้ำ
      const watermark = await imageAnalyzer.detectWatermark(imageBuffer);
      const watermarkMatch = watermark.detected ? watermark.confidence : 0;
      console.log(`💧 Watermark match: ${watermarkMatch}%`);
      
      // 4. ตรวจจับลายเซ็น
      const signature = await imageAnalyzer.detectSignature(imageBuffer);
      const signatureMatch = signature.confidence;
      console.log(`✍️ Signature match: ${signatureMatch}%`);
      
      // 5. วิเคราะห์ Layout
      const layout = await imageAnalyzer.analyzeLayout(imageBuffer);
      const expectedLayout = {
        textRegions: 5,
        imageRegions: 2,
        emptySpaceRatio: 0.3
      };
      const layoutMatch = imageAnalyzer.compareLayout(layout, expectedLayout);
      console.log(`📐 Layout match: ${layoutMatch}%`);
      
      // 6. จัดกลุ่ม features
      const matchedFeatures = [
        backgroundMatch > 70 ? "background" : null,
        logoMatch > 70 ? "logo" : null,
        watermarkMatch > 70 ? "watermark" : null,
        signatureMatch > 70 ? "signature" : null,
        layoutMatch > 70 ? "layout" : null
      ].filter(Boolean);
      
      const failedFeatures = [
        backgroundMatch <= 70 ? "background" : null,
        logoMatch <= 70 ? "logo" : null,
        watermarkMatch <= 70 ? "watermark" : null,
        signatureMatch <= 70 ? "signature" : null,
        layoutMatch <= 70 ? "layout" : null
      ].filter(Boolean);
      
      const missingSecurityElements = [];
      if (!watermark.detected) missingSecurityElements.push("watermark");
      if (!signature.detected) missingSecurityElements.push("signature");
      
      return {
        matchedFeatures,
        failedFeatures,
        missingSecurityElements,
        visualAnalysis: {
          backgroundMatch,
          logoMatch,
          watermarkMatch,
          signatureMatch,
          layoutMatch
        }
      };
    } catch (error) {
      this.logError("❌ Error comparing with template", error);
      // Return default values on error
      return {
        matchedFeatures: [],
        failedFeatures: ["background", "logo", "watermark", "signature", "layout"],
        missingSecurityElements: ["watermark", "signature"],
        visualAnalysis: {
          backgroundMatch: 0,
          logoMatch: 0,
          watermarkMatch: 0,
          signatureMatch: 0,
          layoutMatch: 0
        }
      };
    }
  }

  /**
   * คำนวณ Confidence Score
   */
  private calculateConfidenceScore(ocrResult: any, templateComparison: any): number {
    try {
      console.log("🧮 [CertificateService] Calculating confidence score...");
      
      // 1. Visual Analysis Score (30%)
      const visualScores = [
        templateComparison?.visualAnalysis?.backgroundMatch || 0,
        templateComparison?.visualAnalysis?.logoMatch || 0,
        templateComparison?.visualAnalysis?.watermarkMatch || 0,
        templateComparison?.visualAnalysis?.signatureMatch || 0,
        templateComparison?.visualAnalysis?.layoutMatch || 0
      ];
      const visualAvg = visualScores.reduce((a, b) => a + b, 0) / visualScores.length;
      console.log(`🎨 Visual Analysis Average: ${visualAvg.toFixed(2)}%`);
      
      // 2. Content Analysis Score (40%)
      const contentScores = [
        this.calculateFieldCompleteness(ocrResult),
        this.calculateFormatConsistency(ocrResult),
        this.calculateDataValidity(ocrResult),
        this.calculateTextQuality(ocrResult)
      ];
      const contentAvg = contentScores.reduce((a, b) => a + b, 0) / contentScores.length;
      console.log(`📝 Content Analysis Average: ${contentAvg.toFixed(2)}%`);
      
      // 3. Security Analysis Score (30%)
      const securityScores = [
        this.checkQRCodeValidity(ocrResult) ? 100 : 0,
        templateComparison?.visualAnalysis?.watermarkMatch || 0,
        !this.detectTampering(ocrResult) ? 100 : 0
      ];
      const securityAvg = securityScores.reduce((a, b) => a + b, 0) / securityScores.length;
      console.log(`🔒 Security Analysis Average: ${securityAvg.toFixed(2)}%`);
      
      // Weighted average
      const confidenceScore = (
        visualAvg * 0.3 +
        contentAvg * 0.4 +
        securityAvg * 0.3
      );
      
      console.log(`✅ Final Confidence Score: ${confidenceScore.toFixed(2)}%`);
      console.log(`   - Visual (30%): ${(visualAvg * 0.3).toFixed(2)}%`);
      console.log(`   - Content (40%): ${(contentAvg * 0.4).toFixed(2)}%`);
      console.log(`   - Security (30%): ${(securityAvg * 0.3).toFixed(2)}%`);
      
      return Math.round(confidenceScore);
    } catch (error) {
      this.logError("❌ Error calculating confidence score", error);
      return 0;
    }
  }

  /**
   * สร้างคำแนะนำ
   */
  private generateRecommendations(ocrResult: any, templateComparison: any, confidenceScore: number): string[] {
    const recommendations: string[] = [];
    
    if (confidenceScore < 70) {
      recommendations.push("ใบรับรองมีความเสี่ยงสูง กรุณาตรวจสอบเพิ่มเติม");
    }
    
    if (templateComparison?.failedFeatures?.includes("signature")) {
      recommendations.push("ลายเซ็นไม่ตรงกับเทมเพลต");
    }
    
    return recommendations;
  }

  /**
   * คำนวณความสมบูรณ์ของฟิลด์
   */
  private calculateFieldCompleteness(ocrResult: any): number {
    const requiredFields = ['student_name', 'course_name', 'instructor_name', 'completion_date'];
    const presentFields = requiredFields.filter(field => {
      const value = ocrResult?.[field];
      return value && value !== '-' && value.length > 0;
    });
    
    const score = (presentFields.length / requiredFields.length) * 100;
    console.log(`📊 Field Completeness: ${presentFields.length}/${requiredFields.length} = ${score.toFixed(2)}%`);
    return Math.round(score);
  }

  /**
   * คำนวณความสอดคล้องของรูปแบบ
   */
  private calculateFormatConsistency(ocrResult: any): number {
    let score = 100;
    
    // ตรวจสอบรูปแบบวันที่
    if (ocrResult?.completion_date) {
      const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
      if (!datePattern.test(ocrResult.completion_date)) {
        score -= 25;
        console.log(`⚠️ Invalid date format: ${ocrResult.completion_date}`);
      }
    } else {
      score -= 25;
    }
    
    // ตรวจสอบรูปแบบชื่อ
    if (ocrResult?.student_name) {
      const namePattern = /^[A-Za-zก-๙\s]+$/;
      if (!namePattern.test(ocrResult.student_name)) {
        score -= 25;
        console.log(`⚠️ Invalid student name format: ${ocrResult.student_name}`);
      }
    } else {
      score -= 25;
    }
    
    // ตรวจสอบชื่อหลักสูตร
    if (!ocrResult?.course_name || ocrResult.course_name === '-') {
      score -= 25;
    }
    
    // ตรวจสอบชื่ออาจารย์
    if (!ocrResult?.instructor_name || ocrResult.instructor_name === '-') {
      score -= 25;
    }
    
    console.log(`📋 Format Consistency: ${score}%`);
    return Math.max(0, score);
  }

  /**
   * คำนวณความถูกต้องของข้อมูล
   */
  private calculateDataValidity(ocrResult: any): number {
    let score = 100;
    
    // ตรวจสอบความยาวของข้อมูล
    if (ocrResult?.student_name) {
      if (ocrResult.student_name.length < 3) {
        score -= 30;
        console.log(`⚠️ Student name too short: ${ocrResult.student_name}`);
      }
      if (ocrResult.student_name.length > 100) {
        score -= 20;
        console.log(`⚠️ Student name too long: ${ocrResult.student_name}`);
      }
    } else {
      score -= 40;
    }
    
    if (ocrResult?.course_name) {
      if (ocrResult.course_name.length < 5) {
        score -= 30;
        console.log(`⚠️ Course name too short: ${ocrResult.course_name}`);
      }
    } else {
      score -= 40;
    }
    
    // ตรวจสอบว่ามีข้อมูลที่สมเหตุสมผล
    if (ocrResult?.student_name && ocrResult?.course_name &&
        ocrResult.student_name === ocrResult.course_name) {
      score -= 40;
      console.log(`⚠️ Student name equals course name (suspicious)`);
    }
    
    // ตรวจสอบวันที่ว่าไม่เป็นอนาคต
    if (ocrResult?.completion_date) {
      const dateMatch = ocrResult.completion_date.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        const certDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (certDate > new Date()) {
          score -= 30;
          console.log(`⚠️ Certificate date is in the future`);
        }
      }
    }
    
    console.log(`✅ Data Validity: ${score}%`);
    return Math.max(0, score);
  }

  /**
   * คำนวณคุณภาพของข้อความ
   */
  private calculateTextQuality(ocrResult: any): number {
    const rawText = ocrResult?.rawText || '';
    
    if (!rawText || rawText.length === 0) {
      console.log(`⚠️ No raw text available`);
      return 0;
    }
    
    let score = 100;
    
    // ตรวจสอบ special characters มากเกินไป
    const specialCharCount = (rawText.match(/[^a-zA-Zก-๙0-9\s\.\,\-\(\)]/g) || []).length;
    const specialCharRatio = specialCharCount / rawText.length;
    if (specialCharRatio > 0.1) {
      score -= 30;
      console.log(`⚠️ Too many special characters: ${(specialCharRatio * 100).toFixed(2)}%`);
    }
    
    // ตรวจสอบความยาวของข้อความ
    if (rawText.length < 50) {
      score -= 40;
      console.log(`⚠️ Text too short: ${rawText.length} characters`);
    }
    
    // ตรวจสอบว่ามีคำที่เกี่ยวข้องกับใบรับรอง
    const certificateKeywords = ['certificate', 'completion', 'awarded', 'course', 'ใบรับรอง', 'หลักสูตร'];
    const hasKeywords = certificateKeywords.some(keyword => 
      rawText.toLowerCase().includes(keyword.toLowerCase())
    );
    if (!hasKeywords) {
      score -= 20;
      console.log(`⚠️ Missing certificate keywords`);
    }
    
    console.log(`📜 Text Quality: ${score}%`);
    return Math.max(0, score);
  }

  /**
   * ตรวจสอบ QR Code
   */
  private checkQRCodeValidity(ocrResult: any): boolean {
    const hasId = !!ocrResult?.certificate_id && ocrResult.certificate_id !== '-';
    console.log(`🔲 QR Code/Certificate ID valid: ${hasId}`);
    return hasId;
  }

  /**
   * ตรวจสอบองค์ประกอบความปลอดภัย
   */
  private checkSecurityElements(ocrResult: any): string[] {
    const elements: string[] = [];
    
    if (ocrResult?.certificate_id && ocrResult.certificate_id !== '-') {
      elements.push("certificate_id");
    }
    
    // ตรวจสอบว่ามีคำที่บ่งบอกถึง watermark
    const rawText = ocrResult?.rawText || '';
    if (rawText.toLowerCase().includes('watermark') || 
        rawText.toLowerCase().includes('official')) {
      elements.push("watermark");
    }
    
    // ตรวจสอบว่ามีข้อมูลลายเซ็น
    if (rawText.toLowerCase().includes('signature') ||
        rawText.toLowerCase().includes('director') ||
        rawText.toLowerCase().includes('professor')) {
      elements.push("signature");
    }
    
    console.log(`🔐 Security elements found: ${elements.join(', ')}`);
    return elements;
  }

  /**
   * ตรวจจับการปลอมแปลง
   */
  private detectTampering(ocrResult: any): boolean {
    const rawText = ocrResult?.rawText || '';
    
    // 1. ข้อความซ้ำซ้อนมากเกินไป
    const words = rawText.split(/\s+/).filter(Boolean);
    if (words.length === 0) return false;
    
    const uniqueWords = new Set(words);
    const repetitionRatio = 1 - (uniqueWords.size / words.length);
    
    if (repetitionRatio > 0.5) {
      console.log(`⚠️ High text repetition ratio: ${(repetitionRatio * 100).toFixed(2)}%`);
      return true;
    }
    
    // 2. ตรวจสอบคำที่บ่งบอกว่าเป็นของปลอม
    const suspiciousKeywords = ['FAKE', 'SAMPLE', 'DRAFT', 'TEST', 'COPY'];
    const hasSuspicious = suspiciousKeywords.some(keyword => 
      rawText.toUpperCase().includes(keyword)
    );
    
    if (hasSuspicious) {
      console.log(`⚠️ Suspicious keywords detected`);
      return true;
    }
    
    // 3. ตรวจสอบความสมบูรณ์ของข้อมูล
    const fieldCount = [
      ocrResult?.student_name,
      ocrResult?.course_name,
      ocrResult?.instructor_name,
      ocrResult?.completion_date
    ].filter(field => field && field !== '-').length;
    
    if (fieldCount < 2) {
      console.log(`⚠️ Too few fields extracted: ${fieldCount}`);
      return true; // ข้อมูลไม่สมบูรณ์เกินไป
    }
    
    console.log(`✅ No tampering detected`);
    return false;
  }
}

