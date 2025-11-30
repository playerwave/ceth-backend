// src/controllers/Student/certificate-verification.controller.ts
import { Request, Response } from "express";
import { CertificateVerificationService } from "../../services/Student/certificate-verification.service";
import { CertificateService } from "../../services/Student/certificate.service";
import { ErrorHandledController } from "../error.handled.controller";
import multer from "multer";
import { callTyphoonOCR } from "../../services/Student/ocr.service";

// ✅ Type definition สำหรับ authenticated request
interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user: {
    id: number;
    roles_id: number;
  };
}

// ✅ Multer configuration
const upload = multer({ 
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  storage: multer.memoryStorage()
});

export class CertificateVerificationController extends ErrorHandledController {
  private certificateVerificationService: CertificateVerificationService;
  private certificateVerificationDAO: any; // ✅ เพิ่ม DAO
  private certificateService: CertificateService; // ✅ เพิ่ม CertificateService

  constructor() {
    super();
    this.certificateVerificationService = new CertificateVerificationService();
    this.certificateService = new CertificateService(); // ✅ เพิ่ม CertificateService
    // ✅ Import DAO
    const { CertificateVerificationDAO } = require("../../daos/Student/certificate-verification.dao");
    this.certificateVerificationDAO = new CertificateVerificationDAO();
  }

  // ✅ Upload Link with Verification
  public uploadLinkWithVerification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      console.log("🔗 [CertificateVerificationController] Upload link with verification");
      
      const { activity_id, linkData, studentId } = req.body; // ✅ แก้เป็น snake_case
      const userId = req.user.id;
      
      console.log("🔗 [CertificateVerificationController] Upload link with verification:", { activity_id, linkData, userId, studentId });
      
      if (!activity_id || !linkData || !studentId) {
        res.status(400).json({ 
          success: false, 
          error: "ข้อมูลไม่ครบถ้วน" 
        });
        return;
      }
      
      // ✅ ใช้ข้อมูลจากลิ้งก์แทนการทำ OCR
      const ocrResult = {
        fullName: linkData.fullName,
        courseName: linkData.courseName,
        teacher: linkData.teacher || "-",
        certificateId: linkData.certificateId,
        date: linkData.date,
        rawText: linkData.rawText,
        certificateType: linkData.certificateType || 'BUU_MOOC',
        organize_name: linkData.organize_name || "สำนักคอมพิวเตอร์ มหาวิทยาลัยบูรพา",
        confidenceScore: linkData.confidenceScore || 100
      };
      
      console.log("🔍 [CertificateVerificationController] Using link data as OCR result:", ocrResult);
      
      // ✅ ใช้ข้อมูลจากลิ้งก์โดยตรง (ไม่ต้องตรวจสอบเพิ่ม)
      const passedVerification = true; // ✅ ลิ้งก์ผ่านการตรวจสอบแล้ว
      
      console.log("✅ [CertificateVerificationController] Link validation passed, proceeding with certificate creation");
      
        // ✅ สร้าง certificate record (ไม่เก็บ certificate_id)
        const certificateData = {
          students_id: studentId, // ✅ ใช้ studentId ที่ส่งมาจาก Frontend
        activity_id: activity_id, // ✅ แก้เป็น snake_case
        certificate_type: linkData.certificateType || 'BUU_MOOC',
        certificate_name: ocrResult.courseName,
        certificate_id: null, // ✅ ไม่เก็บ certificate_id จากลิ้งก์
        date: ocrResult.date, // ✅ ใช้ date แทน certificate_date
        hours: 0, // ✅ เพิ่ม hours (default 0 ชั่วโมง)
        certificate_issuer: ocrResult.organize_name,
        certificate_instructor: ocrResult.teacher,
        status: 'Pass',
        verification_metadata: {
          confidenceScore: ocrResult.confidenceScore,
          source: 'link_validation',
          linkData: linkData,
          originalCertificateId: ocrResult.certificateId // ✅ เก็บไว้ใน metadata แทน
        }
      };
      
      // ✅ บันทึก certificate
      const savedCertificate = await this.certificateService.createCertificate(certificateData);
      console.log("💾 [CertificateVerificationController] Certificate saved:", savedCertificate);
      
        // ✅ เพิ่มชั่วโมง (ใช้ method ที่มีอยู่)
        let hoursResult = null;
        try {
          // ✅ ดึงข้อมูล activity เพื่อดูชั่วโมง
          const activityData = await this.certificateVerificationDAO.getActivityById(activity_id);
          console.log("🔍 [CertificateVerificationController] Activity data:", activityData);
          
          hoursResult = await this.certificateVerificationDAO.addHoursToStudent(
            studentId, // ✅ ใช้ studentId แทน userId
            activity_id // ✅ แก้เป็น snake_case
          );
          console.log("🎉 [CertificateVerificationController] Hours added:", hoursResult);
        } catch (hoursError) {
          console.log("⚠️ [CertificateVerificationController] Hours not added (method not available):", hoursError.message);
          // ✅ ไม่ต้องหยุดการทำงาน แค่ log warning
        }
      
      // ✅ ล้าง cache
      await this.certificateVerificationService.clearActivityCache(studentId);
      
      // ✅ ดึงข้อมูล activity เพื่อส่งชั่วโมงไป Frontend
      let activityData = null;
      try {
        activityData = await this.certificateVerificationDAO.getActivityData(activity_id);
        console.log("🔍 [CertificateVerificationController] Activity for response:", activityData);
      } catch (activityError) {
        console.log("⚠️ [CertificateVerificationController] Could not fetch activity data:", activityError.message);
      }
      
      res.json({
        success: true,
        data: {
          ocrResult,
          nameVerification: {
            isValid: true,
            certificateName: ocrResult.fullName,
            studentName: ocrResult.fullName
          },
          verificationResult: {
            confidenceScore: ocrResult.confidenceScore,
            organize_name: ocrResult.organize_name
          },
          certificateType: linkData.certificateType || 'BUU_MOOC',
          passedVerification,
          hoursAdded: hoursResult,
          // ✅ เพิ่มข้อมูล activity
          activityData: {
            receive_hours: activityData?.recieve_hours || 0, // ✅ ใช้ recieve_hours (สะกดผิดใน DB)
            activity_type: activityData?.type || 'Soft',
            activity_name: activityData?.activity_name || ''
          }
        },
        message: "ตรวจสอบใบรับรองสำเร็จ"
      });
      
    } catch (error) {
      console.error("❌ [CertificateVerificationController] Error:", error);
      res.status(500).json({
        success: false,
        error: "เกิดข้อผิดพลาดในการตรวจสอบใบรับรอง"
      });
    }
  };

  // ✅ Upload Certificate with Verification
  public uploadCertificateWithVerification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      console.log("🔍 [CertificateVerificationController] Upload certificate with verification");
      
      if (!req.file) {
        res.status(400).json({ 
          success: false, 
          error: "No file uploaded" 
        });
        return;
      }

      const { activity_id } = req.body; // ✅ แก้เป็น snake_case
      if (!activity_id) {
        res.status(400).json({ 
          success: false, 
          error: "Activity ID is required" 
        });
        return;
      }

      console.log("📁 [CertificateVerificationController] File received:", {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        activity_id: activity_id, // ✅ เพิ่ม log
        size: req.file.size
      });

      // ✅ ทำ OCR
      console.log("🔍 [CertificateVerificationController] Performing OCR...");
      let fileBufferForOcr = req.file.buffer;
      let certificateTypeForOcr = "BUU MOOC"; // Default
      
      // ✅ ถ้าเป็น PDF ให้ตรวจสอบว่าเป็น THAI MOOC หรือไม่
      if (req.file.mimetype === 'application/pdf') {
        console.log("📄 [CertificateVerificationController] PDF detected, checking if THAI MOOC...");
        
        // ✅ ทำ OCR ครั้งแรกเพื่อ detect certificate type
        const firstOcrResult = await callTyphoonOCR(
          {
            buffer: req.file.buffer,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
          },
          { 
            model: "typhoon-ocr-preview",
            certificateType: "BUU MOOC",
            enableCorrection: true
          }
        );
        
        // ✅ Extract natural_text เพื่อตรวจสอบ certificate type
        let naturalText = "";
        if (firstOcrResult?.results?.[0]?.message?.choices?.[0]?.message?.content) {
          const content = firstOcrResult.results[0].message.choices[0].message.content;
          try {
            const parsed = JSON.parse(content);
            naturalText = parsed.natural_text || parsed.raw_text || content;
          } catch {
            naturalText = content;
          }
        }
        
        // ✅ Detect certificate type
        // ✅ ใช้ detectCertificateType จาก naturalTextParser แทน
        const { detectCertificateType: detectCertType } = require("../../utils/naturalTextParser");
        const detectedType = detectCertType(naturalText);
        console.log("🔍 [CertificateVerificationController] Detected certificate type:", detectedType);
        
        // ✅ ถ้าเป็น THAI MOOC และเป็น PDF ให้ extract หน้า 2
        // ✅ detectCertificateType คืนค่า "THAI MOOC" (มีช่องว่าง)
        if (detectedType === "THAI MOOC") {
          console.log("📄 [CertificateVerificationController] THAI MOOC PDF detected, extracting page 2...");
          const { extractPdfPage2 } = require("../../utils/pdfPageExtractor");
          fileBufferForOcr = await extractPdfPage2(req.file.buffer);
          certificateTypeForOcr = "THAI MOOC";
        }
      }
      
      const rawOcrResult = await callTyphoonOCR(
        {
          buffer: fileBufferForOcr,
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
        },
        { 
          model: "typhoon-ocr-preview",
          certificateType: certificateTypeForOcr,
          enableCorrection: true
        }
      );

      // ✅ ประมวลผล OCR result
      const ocrResult = this.processOcrResult(rawOcrResult);
      console.log("📋 [CertificateVerificationController] Processed OCR result:", ocrResult);

      // ✅ ตรวจสอบประเภท Certificate จาก OCR result
      const certificateType = this.detectCertificateType(ocrResult.rawText);
      console.log("🔍 [CertificateVerificationController] Detected certificate type:", certificateType);

      // ✅ ดึง CertificateBase
      const certificateBase = await this.certificateVerificationService.getCertificateBaseByActivityId(
        parseInt(activity_id)
      );

      if (!certificateBase) {
        res.status(404).json({
          success: false,
          error: "No certificate template found for this activity"
        });
        return;
      }

      // ✅ ตรวจสอบชื่อ-นามสกุล กับข้อมูลนิสิต
      console.log("🔍 [CertificateVerificationController] Verifying student name...");
      const nameVerificationResult = await this.verifyStudentName(
        ocrResult.fullName,
        req.user.id
      );
      
      console.log("🔍 [CertificateVerificationController] Name verification result:", nameVerificationResult);
      
      // ✅ เปรียบเทียบ OCR กับ Template (ไม่ต้องเช็คชื่อก่อน)
      console.log("🔍 [CertificateVerificationController] Comparing OCR with template...");
      const verificationResult = await this.certificateVerificationService.compareOcrWithTemplate(
        ocrResult,
        certificateBase,
        certificateType
      );

      console.log("✅ [CertificateVerificationController] Verification completed:", {
        confidenceScore: verificationResult.confidenceScore,
        isAuthentic: verificationResult.isAuthentic,
        matchedFeatures: verificationResult.matchedFeatures.length,
        failedFeatures: verificationResult.failedFeatures.length
      });
      
      // ✅ เพิ่ม detailed logging
      console.log("📊 [CertificateVerificationController] Detailed Verification Results:", {
        confidenceScore: verificationResult.confidenceScore,
        isAuthentic: verificationResult.isAuthentic,
        verificationDetails: verificationResult.verificationDetails,
        matchedFeatures: verificationResult.matchedFeatures,
        failedFeatures: verificationResult.failedFeatures,
        recommendations: verificationResult.recommendations
      });

      console.log("📊 [CertificateVerificationController] Name Verification Results:", nameVerificationResult);

      // ✅ ตรวจสอบว่าผ่านเกณฑ์หรือไม่
      // ✅ เกณฑ์: confidenceScore >= 70 และ nameValid = Pass
      // ✅ confidenceScore < 60 = ไม่บันทึกลง database (ปฏิเสธ)
      // ✅ 60 <= confidenceScore < 70 = Pending (บันทึกเป็น Pending)
      const passedVerification = nameVerificationResult.isValid && verificationResult.confidenceScore >= 70;
      const isRejected = verificationResult.confidenceScore < 60;
      
      console.log("🔍 [CertificateVerificationController] Passed verification:", passedVerification);
      console.log("📊 [CertificateVerificationController] Verification result:", {
        confidenceScore: verificationResult.confidenceScore,
        isRejected,
        passedVerification
      });

      // ✅ ถ้า confidence score < 60 ไม่ต้องบันทึกลง database
      if (isRejected) {
        console.log("❌ [CertificateVerificationController] Certificate rejected (confidence score < 60), not saving to database");
        res.status(200).json({
          success: false,
          message: "ใบรับรองไม่ผ่านเกณฑ์การตรวจสอบ (คะแนนความเชื่อมั่นต่ำกว่า 60%)",
          data: {
            ocrResult: {
              fullName: ocrResult.fullName,
              courseName: ocrResult.courseName,
              teacher: ocrResult.teacher,
              certificateId: ocrResult.certificateId,
              date: ocrResult.date,
              rawText: ocrResult.rawText
            },
            nameVerification: {
              isValid: nameVerificationResult.isValid,
              certificateName: ocrResult.fullName,
              studentName: nameVerificationResult.studentName,
              studentId: nameVerificationResult.studentId
            },
            verificationResult: {
              confidenceScore: verificationResult.confidenceScore,
              isAuthentic: verificationResult.isAuthentic,
              verificationDetails: verificationResult.verificationDetails,
              matchedFeatures: verificationResult.matchedFeatures,
              failedFeatures: verificationResult.failedFeatures,
              recommendations: verificationResult.recommendations,
              organize_name: verificationResult.organize_name
            },
            certificateType: certificateType,
            passedVerification: false,
            rejected: true,
            reason: "Confidence score below 60%"
          }
        });
        return;
      }

      // ✅ กำหนด status ตาม confidence score (เฉพาะ >= 60)
      // ✅ confidenceScore >= 70 && nameValid = Pass
      // ✅ 60 <= confidenceScore < 70 = Pending
      const certificateStatus: 'Pass' | 'Pending' = passedVerification ? 'Pass' : 'Pending';
      
      console.log("💾 [CertificateVerificationController] Saving certificate to database (confidence score >= 60)...");
      console.log("📊 [CertificateVerificationController] Certificate status:", certificateStatus);
      
      // ✅ ดึง studentId - ใช้จาก nameVerification ถ้ามี ไม่งั้นใช้จาก user service
      let studentId = nameVerificationResult.studentId;
      if (!studentId) {
        console.log("⚠️ [CertificateVerificationController] No studentId from name verification, fetching from user service...");
        studentId = await this.certificateService.getStudentIdFromUserId(req.user.id);
        console.log("✅ [CertificateVerificationController] Retrieved studentId:", studentId);
      }
      
      if (!studentId) {
        res.status(400).json({
          success: false,
          error: "ไม่พบข้อมูลนิสิต"
        });
        return;
      }
      
      // ✅ แปลง date ให้ถูกต้อง - ตรวจสอบว่าเป็น valid date string หรือไม่
      let certificateDate: Date | null = null;
      if (ocrResult.date && ocrResult.date !== "-" && ocrResult.date.trim() !== "") {
        const parsedDate = new Date(ocrResult.date);
        // ✅ ตรวจสอบว่าเป็น valid date หรือไม่
        if (!isNaN(parsedDate.getTime())) {
          certificateDate = parsedDate;
        }
      }
      // ✅ ถ้าไม่มี valid date ให้ใช้ null (ไม่ใช้ new Date() เพราะจะใช้เวลาปัจจุบัน ซึ่งไม่ถูกต้อง)
      
      const savedCertificate = await this.certificateService.uploadCertificate({
        students_id: studentId, // ✅ ใช้ studentId ที่ได้มา
        activity_id: parseInt(activity_id),
        hours: passedVerification ? 0 : 0, // ✅ hours จะถูกเพิ่มโดย system ภายหลัง
        date: certificateDate, // ✅ ใช้ null ถ้าไม่มี valid date
        file: req.file,
        ocr_extracted_data: {
          fullName: ocrResult.fullName,
          courseName: ocrResult.courseName,
          teacher: ocrResult.teacher,
          certificateId: ocrResult.certificateId,
          date: ocrResult.date,
          organize_name: ocrResult.organize_name,
          certificateType: certificateType,
          confidenceScore: verificationResult.confidenceScore,
          status: certificateStatus // ✅ ใช้ status ที่กำหนดตาม confidence score (Pass หรือ Pending)
        }
      });
      
      console.log("💾 [CertificateVerificationController] Certificate saved:", savedCertificate.certificate_id);
      console.log("📊 [CertificateVerificationController] Initial certificate status:", certificateStatus);

      // ✅ ถ้าผ่านเกณฑ์ (Pass) ให้ update status และเพิ่มชั่วโมง
      // ✅ ถ้าเป็น Pending ไม่ต้องทำอะไรเพิ่ม (รอตรวจสอบภายหลัง)
      let hoursAdded = null;
      if (certificateStatus === 'Pass' && savedCertificate) {
        // ✅ ดึงข้อมูล activity เพื่อรับ type และ hours
        try {
          const activity = await this.certificateVerificationDAO.getActivityData(parseInt(activity_id));
          
          if (activity && activity.recieve_hours > 0) {
            // ✅ ตรวจสอบว่า status ยังเป็น Pass หรือไม่ (อาจถูก update แล้ว)
            // ✅ Update certificate status เป็น Pass เพื่อให้แน่ใจ
            await this.certificateVerificationDAO.updateCertificateStatus(
              savedCertificate.certificate_id,
              'Pass'
            );
            console.log("✅ [CertificateVerificationController] Certificate status confirmed as Pass");
            
            // ✅ เพิ่มชั่วโมงให้นิสิต
            if (activity.type === 'Soft') {
              await this.certificateVerificationDAO.addSoftHours(studentId, activity.recieve_hours);
            } else if (activity.type === 'Hard') {
              await this.certificateVerificationDAO.addHardHours(studentId, activity.recieve_hours);
            }
            
            hoursAdded = {
              type: activity.type || 'Soft',
              hours: activity.recieve_hours || 0
            };
            console.log("✅ [CertificateVerificationController] Hours added to student:", hoursAdded);
          }
        } catch (activityError) {
          console.warn("⚠️ [CertificateVerificationController] Could not add hours:", activityError);
        }
      }

      // ✅ ส่ง response 200 พร้อมข้อมูลการตรวจสอบ
      res.status(200).json({
        success: true,
        message: "การตรวจสอบใบรับรองเสร็จสิ้น",
        hoursAdded: hoursAdded, // ✅ เพิ่ม hoursAdded
        data: {
          ocrResult: {
            fullName: ocrResult.fullName,
            courseName: ocrResult.courseName,
            teacher: ocrResult.teacher,
            certificateId: ocrResult.certificateId,
            date: ocrResult.date,
            rawText: ocrResult.rawText
          },
          nameVerification: {
            isValid: nameVerificationResult.isValid,
            certificateName: ocrResult.fullName,
            studentName: nameVerificationResult.studentName,
            studentId: nameVerificationResult.studentId
          },
          verificationResult: {
            confidenceScore: verificationResult.confidenceScore,
            isAuthentic: verificationResult.isAuthentic,
            verificationDetails: verificationResult.verificationDetails,
            matchedFeatures: verificationResult.matchedFeatures,
            failedFeatures: verificationResult.failedFeatures,
            recommendations: verificationResult.recommendations,
            organize_name: verificationResult.organize_name
          },
          certificateType: certificateType,
          passedVerification: passedVerification
        }
      });
      return;
    } catch (error) {
      console.error("❌ [CertificateVerificationController] Error:", error);
      this.handleError("CertificateVerificationController.uploadCertificateWithVerification", error, res);
    }
  };

  // ✅ ตรวจสอบชื่อ-นามสกุล กับข้อมูลนิสิต
  private verifyStudentName = async (
    certificateName: string, 
    userId?: number
  ): Promise<{
    isValid: boolean;
    studentName?: string;
    studentId?: number;
  }> => {
    try {
      console.log("🔍 [CertificateVerificationController] Verifying student name:", {
        certificateName,
        userId
      });

      if (!userId) {
        console.log("❌ [CertificateVerificationController] No user ID provided");
        return { isValid: false };
      }

      if (!certificateName || certificateName === "-") {
        console.log("❌ [CertificateVerificationController] No certificate name provided");
        return { isValid: false };
      }

      // ✅ ดึงข้อมูลนิสิตจาก database
      const studentData = await this.certificateVerificationDAO.getStudentData(userId);
      
      if (!studentData) {
        console.log("❌ [CertificateVerificationController] Student not found");
        return { isValid: false };
      }

      const studentFullName = `${studentData.first_name_eng} ${studentData.last_name_eng}`.trim();
      console.log("🔍 [CertificateVerificationController] Student full name:", studentFullName);

      // ✅ เปรียบเทียบชื่อ
      const isNameMatch = this.compareNames(certificateName, studentFullName);
      
      console.log("🔍 [CertificateVerificationController] Name comparison result:", {
        certificateName,
        studentFullName,
        isNameMatch
      });

      return {
        isValid: isNameMatch,
        studentName: studentFullName,
        studentId: studentData.id
      };
    } catch (error) {
      console.error("❌ [CertificateVerificationController] Error verifying student name:", error);
      return { isValid: false };
    }
  };


  // ✅ เปรียบเทียบชื่อ
  private compareNames = (certificateName: string, studentName: string): boolean => {
    try {
      // ✅ Normalize certificate name (เปลี่ยนเป็นพิมพ์ใหญ่ทั้งหมด)
      const normalizeCertificateName = (name: string) => {
        return name
          .toUpperCase()
          .trim()
          .replace(/\s+/g, ' ') // ✅ แปลง multiple spaces เป็น single space
          .replace(/[^\w\s]/g, ''); // ✅ ลบ special characters
      };

      // ✅ Normalize student name (ตัด MR./MISS. ออก แล้วเปลี่ยนเป็นพิมพ์ใหญ่)
      const normalizeStudentName = (name: string) => {
        return name
          .replace(/^(MR\.?|MISS\.?|MRS\.?|MS\.?|DR\.?|PROF\.?)(?:\s+|(?=[A-Z]))/i, '') // ✅ รองรับทั้งมีจุด/ไม่มีจุด และติดชื่อเลย
          .toUpperCase()
          .trim()
          .replace(/\s+/g, ' ') // ✅ แปลง multiple spaces เป็น single space
          .replace(/[^\w\s]/g, ''); // ✅ ลบ special characters
      };

      const normalizedCertName = normalizeCertificateName(certificateName);
      const normalizedStudentName = normalizeStudentName(studentName);

      console.log("🔍 [CertificateVerificationController] Normalized names:", {
        certificate: normalizedCertName,
        student: normalizedStudentName
      });

      // ✅ ตรวจสอบ exact match
      if (normalizedCertName === normalizedStudentName) {
        console.log("✅ [CertificateVerificationController] Exact name match");
        return true;
      }

      // ✅ ตรวจสอบ similarity (Levenshtein distance)
      const similarity = this.calculateNameSimilarity(normalizedCertName, normalizedStudentName);
      console.log("🔍 [CertificateVerificationController] Name similarity:", similarity);

      // ✅ ถ้า similarity >= 85% ถือว่าเป็นชื่อเดียวกัน
      return similarity >= 85;
    } catch (error) {
      console.error("❌ [CertificateVerificationController] Error comparing names:", error);
      return false;
    }
  };

  // ✅ คำนวณความคล้ายคลึงของชื่อ
  private calculateNameSimilarity = (name1: string, name2: string): number => {
    const distance = this.levenshteinDistance(name1, name2);
    const maxLength = Math.max(name1.length, name2.length);
    
    if (maxLength === 0) return 100;
    
    const similarity = ((maxLength - distance) / maxLength) * 100;
    return Math.max(0, Math.min(100, similarity));
  };

  // ✅ Levenshtein distance algorithm
  private levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // ✅ เพิ่ม hours และ activity ให้นิสิต
  private addStudentHoursAndActivity = async (
    studentId: number,
    activityId: number,
    certificateBase: any
  ): Promise<{
    type: 'Soft' | 'Hard';
    hours: number;
  } | null> => {
    try {
      console.log("🔍 [CertificateVerificationController] Adding hours and activity:", {
        studentId,
        activityId
      });

      // ✅ ดึงข้อมูล activity
      const activityData = await this.certificateVerificationDAO.getActivityData(activityId);
      if (!activityData) {
        throw new Error("Activity not found");
      }

      console.log("🔍 [CertificateVerificationController] Activity data:", {
        type: activityData.type,
        recieve_hours: activityData.recieve_hours
      });

      // ✅ เพิ่ม hours ตาม activity type
      let hoursResult = null;
      if (activityData.type === 'Soft') {
        await this.certificateVerificationDAO.addSoftHours(studentId, activityData.recieve_hours);
        console.log("✅ [CertificateVerificationController] Added soft hours:", activityData.recieve_hours);
        hoursResult = {
          type: 'Soft' as const,
          hours: activityData.recieve_hours
        };
      } else if (activityData.type === 'Hard') {
        await this.certificateVerificationDAO.addHardHours(studentId, activityData.recieve_hours);
        console.log("✅ [CertificateVerificationController] Added hard hours:", activityData.recieve_hours);
        hoursResult = {
          type: 'Hard' as const,
          hours: activityData.recieve_hours
        };
      }

      // ✅ ไม่ต้องเพิ่ม student_activity เพราะ certificate table เก็บ activity_id อยู่แล้ว
      console.log("✅ [CertificateVerificationController] Activity tracking handled by certificate table");

      return hoursResult;
    } catch (error) {
      console.error("❌ [CertificateVerificationController] Error adding hours and activity:", error);
      throw error;
    }
  };


  // ✅ Smart Name Validation - ตรวจสอบว่า candidate เป็นชื่อจริงหรือไม่
  private isValidName = (candidate: string, certificateType: 'THAI_MOOC' | 'BUU_MOOC' | 'UNKNOWN'): boolean => {
    console.log("🔍 [CertificateVerificationController] Validating name candidate:", {
      candidate,
      length: candidate.length,
      certificateType
    });
    
    // ✅ Basic length check
    if (candidate.length < 3 || candidate.length > 100) {
      console.log("❌ [CertificateVerificationController] Invalid length:", candidate.length);
      return false;
    }
    
    // ✅ Check for invalid keywords
    const invalidKeywords = [
      'CERTIFICATE', 'AWARDED', 'COMPLETION', 'PRESENTED', 'THAI', 'MOOC',
      'UNIVERSITY', 'COLLEGE', 'INSTITUTE', 'PROJECT', 'MINISTRY', 'DEPARTMENT',
      'OFFICE', 'CENTER', 'DIRECTOR', 'PROFESSOR', 'DOCTOR', 'DR', 'MR', 'MRS', 'MISS'
    ];
    
    const upperCandidate = candidate.toUpperCase();
    for (const keyword of invalidKeywords) {
      if (upperCandidate.includes(keyword)) {
        console.log("❌ [CertificateVerificationController] Contains invalid keyword:", keyword);
        return false;
      }
    }
    
    // ✅ Check for course-related keywords
    const courseKeywords = [
      'for the', 'fulfillment', 'online course', 'has successfully', 'has completed',
      'completion', 'course', 'hours', 'english', 'communication'
    ];
    
    const lowerCandidate = candidate.toLowerCase();
    for (const keyword of courseKeywords) {
      if (lowerCandidate.includes(keyword)) {
        console.log("❌ [CertificateVerificationController] Contains course keyword:", keyword);
        return false;
      }
    }
    
    // ✅ Check for proper name format (at least 2 words, starts with capital)
    const words = candidate.split(/\s+/);
    if (words.length < 2) {
      console.log("❌ [CertificateVerificationController] Too few words:", words.length);
      return false;
    }
    
    // ✅ Check that all words start with capital letter
    for (const word of words) {
      if (!/^[A-Z]/.test(word)) {
        console.log("❌ [CertificateVerificationController] Word doesn't start with capital:", word);
        return false;
      }
    }
    
    console.log("✅ [CertificateVerificationController] Name validation passed:", candidate);
    return true;
  };

  // ✅ ตรวจสอบประเภท Certificate
  private detectCertificateType = (content: string): 'THAI_MOOC' | 'BUU_MOOC' | 'UNKNOWN' => {
    console.log("🔍 [CertificateVerificationController] Detecting certificate type...");
    
    const upperContent = content.toUpperCase();
    
    // ✅ ตรวจสอบ Thai MOOC
    if (upperContent.includes('THAI MOOC') || 
        upperContent.includes('THAILAND MASSIVE OPEN ONLINE COURSE') ||
        upperContent.includes('CERTIFICATE OF COMPLETION') && upperContent.includes('THAI')) {
      console.log("✅ [CertificateVerificationController] Detected: THAI_MOOC");
      return 'THAI_MOOC';
    }
    
    // ✅ ตรวจสอบ BUU MOOC
    if (upperContent.includes('BUU MOOC') || 
        upperContent.includes('BURAPHA UNIVERSITY') ||
        upperContent.includes('CERTIFICATE OF BUU MOOC') ||
        upperContent.includes('BUU MOOC')) {
      console.log("✅ [CertificateVerificationController] Detected: BUU_MOOC");
      return 'BUU_MOOC';
    }
    
    console.log("⚠️ [CertificateVerificationController] Unknown certificate type");
    return 'UNKNOWN';
  };

  // ✅ ประมวลผล OCR result - ใช้ parseThaiMoocData และ parseBuuMoocData เหมือนกับอาจารย์
  private processOcrResult = (rawData: unknown): {
    fullName: string;
    courseName: string;
    teacher: string;
    certificateId: string;
    date: string;
    organize_name?: string; // ✅ เพิ่ม organization name
    rawText: string;
  } => {
    // ✅ Import parse functions
    const { parseThaiMoocData } = require("../../utils/naturalTextParser");
    const { parseBuuMoocData } = require("../../utils/naturalTextParser");
      console.log("🔄 [CertificateVerificationController] Processing OCR result...");
      console.log("🔍 [CertificateVerificationController] Raw OCR data structure:", {
        hasResults: rawData && typeof rawData === 'object' && 'results' in rawData,
        resultsLength: rawData && typeof rawData === 'object' && 'results' in rawData ? (rawData as { results: unknown[] }).results.length : 0
      });
      
      // ✅ เพิ่ม debug logging สำหรับการติดตามปัญหา
      console.log("🔍 [CertificateVerificationController] Starting OCR result processing...");
      
      try {
        // ✅ Extract raw content from Typhoon API response
        let rawContent = "";
      if (rawData && typeof rawData === 'object' && 'results' in rawData) {
        const results = (rawData as { results: unknown[] }).results;
        if (Array.isArray(results) && results.length > 0) {
          const firstResult = results[0];
          if (firstResult && typeof firstResult === 'object' && 'message' in firstResult) {
            const message = (firstResult as { message: unknown }).message;
            if (message && typeof message === 'object' && 'choices' in message) {
              const choices = (message as { choices: unknown[] }).choices;
              if (Array.isArray(choices) && choices.length > 0) {
                const firstChoice = choices[0];
                if (firstChoice && typeof firstChoice === 'object' && 'message' in firstChoice) {
                  const choiceMessage = (firstChoice as { message: unknown }).message;
                  if (choiceMessage && typeof choiceMessage === 'object' && 'content' in choiceMessage) {
                    rawContent = (choiceMessage as { content: string }).content;
                    console.log("📄 [CertificateVerificationController] Extracted raw content length:", rawContent.length);
                    console.log("📄 [CertificateVerificationController] Raw content preview:", rawContent.substring(0, 200) + "...");
                  }
                }
              }
            }
          }
        }
      }
      
      console.log("🔍 [CertificateVerificationController] Final raw content:", {
        length: rawContent.length,
        startsWithBrace: rawContent.trim().startsWith("{"),
        preview: rawContent.substring(0, 100) + "..."
      });

      // ✅ ตรวจสอบว่าเป็น structured JSON response หรือไม่
      if (rawContent.trim().startsWith("{")) {
        try {
          const structuredData = JSON.parse(rawContent);
          console.log("✅ [CertificateVerificationController] Received structured JSON response");
          
          // ✅ ถ้ามี natural_text ให้ใช้แทน rawContent สำหรับ regex parsing
          if (structuredData.natural_text) {
            rawContent = structuredData.natural_text;
            console.log("✅ [CertificateVerificationController] Extracted natural_text from JSON:", {
              length: rawContent.length,
              preview: rawContent.substring(0, 200)
            });
          }
          
          // ✅ ตรวจสอบว่ามีข้อมูลที่จำเป็นหรือไม่
          const hasValidData = structuredData.student_name && 
                              structuredData.student_name !== "-" && 
                              structuredData.course_name && 
                              structuredData.course_name !== "-" &&
                              structuredData.completion_date &&
                              structuredData.completion_date !== "-";
          
          if (hasValidData) {
            console.log("✅ [CertificateVerificationController] Valid structured data found");
            return {
              fullName: structuredData.student_name || "-",
              courseName: structuredData.course_name || "-",
              teacher: structuredData.instructor_name || "-",
              certificateId: structuredData.certificate_id || "-",
              date: structuredData.completion_date || "-",
              rawText: structuredData.raw_text || rawContent
            };
          } else {
            console.log("⚠️ [CertificateVerificationController] Structured data incomplete, falling back to parseThaiMoocData/parseBuuMoocData");
          }
        } catch (e) {
          console.log("⚠️ [CertificateVerificationController] Failed to parse JSON content, falling back to parseThaiMoocData/parseBuuMoocData");
        }
      }

      // ✅ ใช้ parseThaiMoocData และ parseBuuMoocData เหมือนกับอาจารย์
      console.log("🔍 [CertificateVerificationController] Using parseThaiMoocData/parseBuuMoocData for extraction...");
      console.log("📄 [CertificateVerificationController] Raw content length:", rawContent.length);
      console.log("📄 [CertificateVerificationController] Raw content preview:", rawContent.substring(0, 500));
      
      // ✅ Detect certificate type จาก rawContent
      const { detectCertificateType: detectCertType } = require("../../utils/naturalTextParser");
      const detectedCertType = detectCertType(rawContent);
      console.log("🔍 [CertificateVerificationController] Detected certificate type:", detectedCertType);
      
      // ✅ Extract fields ตาม certificate type
      let fullName = "-";
      let courseName = "-";
      let teacher = "-";
      let date = "-";
      let certificateId = "-";
      let organize_name = "-";
      
      if (detectedCertType === "THAI MOOC") {
        // ✅ ใช้ parseThaiMoocData สำหรับ THAI MOOC
        console.log("📄 [CertificateVerificationController] Parsing THAI MOOC data using parseThaiMoocData...");
        const parsedData = parseThaiMoocData(rawContent);
        console.log("✅ [CertificateVerificationController] Parsed THAI MOOC data:", parsedData);
        
        // ✅ Map parsed data ไปยัง fields ที่ต้องการ
        fullName = parsedData.firstName && parsedData.lastName 
          ? `${parsedData.firstName} ${parsedData.lastName}`.trim()
          : "-";
        courseName = parsedData.certificate_name || "-";
        teacher = parsedData.supervisor_name1 || "-";
        organize_name = parsedData.organize_base_name || "-";
        
        // ✅ Format date
        if (parsedData.get_certificate_date) {
          const dateObj = parsedData.get_certificate_date;
          if (dateObj instanceof Date) {
            // ✅ Format: "29 June 2025"
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
            date = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
          } else {
            date = String(dateObj);
          }
        } else {
          date = "-";
        }
        
        console.log("✅ [CertificateVerificationController] Mapped THAI MOOC fields:", {
          fullName,
          courseName,
          teacher,
          date,
          organize_name
        });
      } else if (detectedCertType === "BUU MOOC") {
        // ✅ ใช้ parseBuuMoocData สำหรับ BUU MOOC
        console.log("📄 [CertificateVerificationController] Parsing BUU MOOC data using parseBuuMoocData...");
        const parsedData = parseBuuMoocData(rawContent);
        console.log("✅ [CertificateVerificationController] Parsed BUU MOOC data:", parsedData);
        
        // ✅ Map parsed data ไปยัง fields ที่ต้องการ
        fullName = parsedData.firstName && parsedData.lastName 
          ? `${parsedData.firstName} ${parsedData.lastName}`.trim()
          : "-";
        courseName = parsedData.certificate_name || "-";
        teacher = parsedData.supervisor_name1 || "-";
        organize_name = parsedData.organize_base_name || "-";
        
        // ✅ Format date
        if (parsedData.get_certificate_date) {
          const dateObj = parsedData.get_certificate_date;
          if (dateObj instanceof Date) {
            // ✅ Format: "June 30, 2025"
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
            date = `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
          } else {
            date = String(dateObj);
          }
        } else {
          date = "-";
        }
        
        // ✅ Extract certificate ID สำหรับ BUU MOOC
        const certificateIdPatterns = [
          /Certificate ID Number\s*:\s*([A-Z0-9a-f]+)/i,
          /Certificate ID\s*:\s*([A-Z0-9a-f]+)/i,
          /ID\s*:\s*([A-Z0-9a-f]+)/i
        ];
        
        for (const pattern of certificateIdPatterns) {
          const match = rawContent.match(pattern);
          if (match && match[1]) {
            certificateId = match[1].trim();
            console.log("✅ [CertificateVerificationController] Certificate ID found:", certificateId);
            break;
          }
        }
        
        console.log("✅ [CertificateVerificationController] Mapped BUU MOOC fields:", {
          fullName,
          courseName,
          teacher,
          date,
          certificateId,
          organize_name
        });
      } else {
        // ✅ Fallback: ใช้ regex patterns แบบเดิมถ้าไม่ใช่ THAI MOOC หรือ BUU MOOC
        console.log("⚠️ [CertificateVerificationController] Unknown certificate type, using fallback regex patterns");
        
        // ✅ Simple text processing - ปรับปรุงการ clean text (รองรับ Markdown)
        const cleanContent = rawContent
          .replace(/\\n/g, '\n')  // ✅ แปลง \\n เป็น \n
          .replace(/^#+\s+/gm, '') // ✅ ลบ markdown headers (#, ##)
          .replace(/^-\s+/gm, '')  // ✅ ลบ bullet points (-)
          .replace(/\|[^|]+\|/g, '') // ✅ ลบ markdown tables
          .replace(/\n+/g, ' ')   // ✅ แปลง line breaks เป็น spaces
          .replace(/\s+/g, ' ')    // ✅ แปลง multiple spaces เป็น single space
          .trim();
        
        // ✅ ใช้ regex patterns แบบเดิม (fallback)
        // ✅ Extract name (fallback)
        const nameMatch = rawContent.match(/####\s+([^\n]+)/) || 
                         rawContent.match(/THIS CERTIFICATE IS AWARDED TO[^\n]*\n+[^\n]*\n+([^\n]+)/i);
        if (nameMatch && nameMatch[1]) {
          fullName = nameMatch[1].trim();
        }
        
        // ✅ Extract course name (fallback)
        const courseMatch = rawContent.match(/\*\*([^*]+?)\*\*/);
        if (courseMatch && courseMatch[1]) {
          courseName = courseMatch[1].trim().replace(/\s*\([^)]*Hours?[^)]*\)\s*/i, '');
        }
        
        // ✅ Extract date (fallback)
        const dateMatch = rawContent.match(/on\s+(\d{1,2}\s+[A-Z][a-z]+\s+\d{4})/i);
        if (dateMatch && dateMatch[1]) {
          date = dateMatch[1].trim();
        }
        
        // ✅ Extract teacher (fallback)
        const afterSeparator = rawContent.split('---');
        if (afterSeparator.length > 1) {
          const supervisorLines = afterSeparator[afterSeparator.length - 1].split('\n').filter(l => l.trim());
          if (supervisorLines.length > 0) {
            teacher = supervisorLines[0].trim();
          }
        }
        
        // ✅ Extract organize_name (fallback)
        const awardedByMatch = rawContent.match(/Awarded by\s+(.+?)\s+on/i);
        if (awardedByMatch && awardedByMatch[1]) {
          organize_name = awardedByMatch[1].trim();
        }
      }
      
      // ✅ Skip old regex pattern matching - ใช้ parse functions แทนแล้ว
      // ✅ เพิ่ม debug logging สำหรับการติดตามปัญหา
      console.log("🔍 [CertificateVerificationController] Final extraction results:", {
        fullName,
        courseName,
        teacher,
        certificateId,
        date,
        organize_name
      });

      // ✅ Skip old regex pattern matching - ใช้ parse functions แทนแล้ว (ดูโค้ดด้านบน)
      
      return {
        fullName,
        courseName,
        teacher,
        certificateId,
        date,
        organize_name,
        rawText: rawContent
      };
    } catch (error) {
      console.error("❌ [CertificateVerificationController] Error processing OCR result:", error);
      return {
        fullName: "-",
        courseName: "-",
        teacher: "-",
        certificateId: "-",
        date: "-",
        organize_name: "-",
        rawText: rawData?.toString() || ""
      };
    }
  };
}

// ✅ Export controller instance
const certificateVerificationController = new CertificateVerificationController();
export { certificateVerificationController };
