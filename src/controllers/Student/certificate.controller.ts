// src/controllers/Student/certificate.controller.ts
import { Request, Response } from "express";
import { CertificateService } from "../../services/Student/certificate.service";
import { callTyphoonOCR } from "../../services/Student/ocr.service";

export class CertificateController {
  private certificateService: CertificateService;

  constructor() {
    this.certificateService = new CertificateService();
  }

  //--------------------- Upload Certificate -------------------------
  uploadCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id; // ✅ เปลี่ยนจาก users_id เป็น id
      const file = req.file;
      const { activity_id, hours, date } = req.body;

      console.log("📤 [Certificate Controller] Upload request:", { 
        userId, 
        activity_id,
        hasFile: !!file 
      });

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      if (!file) {
        res.status(400).json({ error: "Certificate file is required" });
        return;
      }

      if (!activity_id) {
        res.status(400).json({ error: "Activity ID is required" });
        return;
      }

      // Step 1: ทำ OCR เพื่อดึงข้อมูลจากใบรับรอง
      console.log("🔍 [Certificate Controller] Performing OCR...");
      let ocrData = null;
      try {
        const ocrResult = await callTyphoonOCR(
          {
            buffer: file.buffer,
            filename: file.originalname,
            mimetype: file.mimetype,
          },
          {
            model: "typhoon-ocr-preview",
            prompt: `Extract the following information from this certificate:
              - Student name
              - Course name
              - Instructor name
              - Completion date
              - Certificate ID
              Return as JSON: { "student_name": "...", "course_name": "...", "instructor_name": "...", "completion_date": "...", "certificate_id": "..." }`
          }
        );

        // Process OCR result
        if (ocrResult?.results?.[0]?.message?.choices?.[0]?.message?.content) {
          const content = ocrResult.results[0].message.choices[0].message.content;
          try {
            ocrData = JSON.parse(content);
          } catch {
            ocrData = { raw_text: content };
          }
        }
        console.log("✅ [Certificate Controller] OCR completed:", ocrData);
      } catch (ocrError) {
        console.warn("⚠️ [Certificate Controller] OCR failed, continuing without OCR data:", ocrError);
      }

      // Step 2: สร้าง certificate record
      const certificate = await this.certificateService.uploadCertificate({
        students_id: userId,
        activity_id: parseInt(activity_id),
        hours: hours ? parseInt(hours) : undefined,
        date: date ? new Date(date) : new Date(),
        file: file,
        ocr_extracted_data: ocrData
      });

      console.log("✅ [Certificate Controller] Certificate uploaded:", certificate.certificate_id);
      res.status(201).json({
        success: true,
        message: "Certificate uploaded successfully",
        data: certificate
      });
    } catch (error) {
      console.error("❌ [Certificate Controller] Upload error:", error);
      res.status(500).json({ 
        error: "Failed to upload certificate",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  };

  //--------------------- Get Certificate By Id -------------------------
  getCertificateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id; // ✅ เปลี่ยนจาก users_id เป็น id // Get user ID from token

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

  //--------------------- Get Certificates By Student ID -------------------------
  getCertificatesByStudentId = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id; // ✅ เปลี่ยนจาก users_id เป็น id

      console.log("🔍 [Certificate Controller] Getting certificates for student:", { userId });

      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const certificates = await this.certificateService.getCertificatesByStudentId(userId);

      console.log("✅ [Certificate Controller] Certificates found:", certificates.length);
      res.json(certificates);
    } catch (error) {
      console.error("❌ [Certificate Controller] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
