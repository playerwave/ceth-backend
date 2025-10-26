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

      const { activityId } = req.body;
      if (!activityId) {
        res.status(400).json({ 
          success: false, 
          error: "Activity ID is required" 
        });
        return;
      }

      console.log("📁 [CertificateVerificationController] File received:", {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        activityId: parseInt(activityId)
      });

      // ✅ ทำ OCR
      console.log("🔍 [CertificateVerificationController] Performing OCR...");
      const rawOcrResult = await callTyphoonOCR(
        {
          buffer: req.file.buffer,
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
        },
        { 
          model: "typhoon-ocr-preview"
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
        parseInt(activityId)
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
      
      // ✅ ถ้าชื่อไม่ตรง ให้ return error ทันที
      if (!nameVerificationResult.isValid) {
        res.status(400).json({
          success: false,
          error: "ชื่อ-นามสกุลในใบรับรองไม่ตรงกับข้อมูลนิสิต",
          details: {
            certificateName: ocrResult.fullName,
            studentName: nameVerificationResult.studentName,
            certificateType: certificateType
          }
        });
        return;
      }

      // ✅ เปรียบเทียบ OCR กับ Template
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
      
      console.log("📊 [CertificateVerificationController] Name Verification Results:", {
        isValid: nameVerificationResult.isValid,
        studentName: nameVerificationResult.studentName,
        studentId: nameVerificationResult.studentId
      });

      // ✅ ถ้าผ่านการตรวจสอบ ให้เพิ่ม hours และ activity
      let hoursAdded = null;
      // ✅ เงื่อนไข: ชื่อต้องตรง และ confidence score ต้อง >= 70%
      const passedVerification = nameVerificationResult.isValid && verificationResult.confidenceScore >= 70;
      
      if (passedVerification) {
        console.log("🔍 [CertificateVerificationController] Certificate passed verification, adding hours and activity...");
        
        try {
          hoursAdded = await this.addStudentHoursAndActivity(
            nameVerificationResult.studentId!,
            parseInt(activityId),
            certificateBase
          );
          
          console.log("✅ [CertificateVerificationController] Successfully added hours and activity:", hoursAdded);
          
          // ✅ Log สรุปการอัพเดทโปรไฟล์นิสิต
          if (hoursAdded) {
            console.log("🎉 [CertificateVerificationController] Student profile updated successfully:", {
              studentId: nameVerificationResult.studentId,
              studentName: nameVerificationResult.studentName,
              hoursType: hoursAdded.type,
              hoursAdded: hoursAdded.hours,
              activityId: parseInt(activityId),
              message: `Student ${nameVerificationResult.studentName} (ID: ${nameVerificationResult.studentId}) has been awarded ${hoursAdded.hours} ${hoursAdded.type} Skills hours for completing certificate activity ${parseInt(activityId)}`
            });
            
            console.log("📚 [CertificateVerificationController] Activity has been added to student's activity history!");
          }

          // ✅ บันทึก Certificate Record ใน Database
          try {
            console.log("🔍 [CertificateVerificationController] Creating certificate record...");
            
            const certificateRecord = await this.certificateService.createCertificate({
              students_id: nameVerificationResult.studentId!,
              activity_id: parseInt(activityId),
              date: new Date(),
              hours: hoursAdded?.hours || 0,
              status: 'Pass', // ✅ ผ่านการตรวจสอบ
              ocr_extracted_data: {
                studentName: ocrResult.fullName,
                courseName: ocrResult.courseName,
                completionDate: ocrResult.date,
                certificateId: ocrResult.certificateId,
                issuerName: ocrResult.teacher
              },
              verification_metadata: {
                lastVerified: new Date(),
                verificationCount: 1,
                confidenceScore: verificationResult.confidenceScore,
                verificationStatus: 'Verified'
              },
              original_filename: req.file.originalname,
              file_type: req.file.mimetype,
              file_size: req.file.size
            });
            
            console.log("✅ [CertificateVerificationController] Certificate record created successfully:", {
              certificateId: certificateRecord.certificate_id,
              studentId: nameVerificationResult.studentId,
              activityId: parseInt(activityId),
              status: 'Pass',
              confidenceScore: verificationResult.confidenceScore
            });
            
         console.log("🎉 [CertificateVerificationController] Certificate has been saved to database!");
         
         // ✅ เพิ่ม: Clear activity history cache หลังจาก claim certificate สำเร็จ
         try {
           const redis = require("../../config/redis").default;
           const cacheKey = `activity:history:${nameVerificationResult.studentId}`;
           await redis.del(cacheKey);
           console.log("🗑️ [CertificateVerificationController] Activity history cache cleared for student:", nameVerificationResult.studentId);
         } catch (cacheError) {
           console.error("❌ [CertificateVerificationController] Error clearing cache:", cacheError);
           // ✅ ไม่ return error เพราะ certificate ยังถูกสร้างแล้ว
         }
       } catch (certificateError) {
         console.error("❌ [CertificateVerificationController] Error creating certificate record:", certificateError);
         // ✅ ไม่ return error เพราะ hours ยังถูกเพิ่มแล้ว
       }
        } catch (error) {
          console.error("❌ [CertificateVerificationController] Error adding hours and activity:", error);
          // ✅ ไม่ return error เพราะ certificate ยังผ่านอยู่
        }
      }

      // ✅ ส่ง certificate type ไปยัง frontend
      const responseWithType = {
        ...verificationResult,
        verified: passedVerification, // ✅ verified ตามเงื่อนไขใหม่ (ชื่อตรง + confidence >= 70)
        warning: nameVerificationResult.isValid && verificationResult.confidenceScore < 70, // ✅ เตือนถ้าชื่อตรงแต่ confidence ต่ำ
        certificateType: certificateType,
        nameVerification: {
          isValid: nameVerificationResult.isValid,
          studentName: nameVerificationResult.studentName
        },
        hoursAdded: hoursAdded, // ✅ ส่งข้อมูล hours ที่เพิ่ม
        ocrData: {
          ...verificationResult.ocrData,
          certificateType: certificateType
        }
      };

      res.status(200).json(responseWithType);
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
          .replace(/^(MR\.|MISS\.|MRS\.|DR\.|PROF\.)\s*/i, '') // ✅ ตัดคำนำหน้าชื่อออก
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

  // ✅ ประมวลผล OCR result
  private processOcrResult = (rawData: unknown): {
    fullName: string;
    courseName: string;
    teacher: string;
    certificateId: string;
    date: string;
    rawText: string;
  } => {
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
            console.log("⚠️ [CertificateVerificationController] Structured data incomplete, falling back to regex parsing");
          }
        } catch (e) {
          console.log("⚠️ [CertificateVerificationController] Failed to parse JSON content, falling back to regex parsing");
        }
      }

      // ✅ Simple text processing - ปรับปรุงการ clean text
      const cleanContent = rawContent
        .replace(/\\n/g, '\n')  // ✅ แปลง \\n เป็น \n
        .replace(/\n+/g, ' ')   // ✅ แปลง line breaks เป็น spaces
        .replace(/\s+/g, ' ')    // ✅ แปลง multiple spaces เป็น single space
        .trim();
      
      console.log("🔍 [CertificateVerificationController] Cleaned content:", cleanContent.substring(0, 200) + "...");
      
      // ✅ ตรวจสอบประเภท Certificate
      const certificateType = this.detectCertificateType(cleanContent);
      console.log("🔍 [CertificateVerificationController] Certificate type:", certificateType);
      
      const lines = cleanContent
        .split(/\s/)
        .map((l: string) => l.trim())
        .filter(Boolean);

      // ✅ Extract information using conditional patterns based on certificate type
      let fullName = "-";
      let courseName = "-";
      let teacher = "-";
      let date = "-";
      let certificateId = "-";
      
      // ✅ เพิ่ม debug logging สำหรับการติดตามปัญหา
      console.log("🔍 [CertificateVerificationController] Starting regex pattern matching...");
      console.log("🔍 [CertificateVerificationController] Raw content length:", rawContent.length);
      console.log("🔍 [CertificateVerificationController] Raw content preview:", rawContent.substring(0, 300) + "...");

      // ✅ Find full name - Conditional patterns based on certificate type
      let namePatterns: RegExp[] = [];
      
      if (certificateType === 'THAI_MOOC') {
        // ✅ Thai MOOC specific patterns - Smart extraction
        namePatterns = [
          /THIS CERTIFICATE IS AWARDED TO\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+for)/i, // ✅ Capture เฉพาะชื่อ
          /THIS CERTIFICATE IS AWARDED TO\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+for the)/i, // ✅ Capture เฉพาะชื่อ
          /THIS CERTIFICATE IS AWARDED TO\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+for the completion)/i, // ✅ Capture เฉพาะชื่อ
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+for the completion)/i, // ✅ Fallback pattern
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+for the fulfillment)/i // ✅ Fallback pattern
        ];
      } else if (certificateType === 'BUU_MOOC') {
        // ✅ BUU MOOC specific patterns - Smart extraction
        namePatterns = [
          /is presented to\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+has)/i, // ✅ Capture เฉพาะชื่อ
          /presented to\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+has)/i, // ✅ Capture เฉพาะชื่อ
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+has successfully)/i, // ✅ Fallback pattern
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+has completed)/i // ✅ Fallback pattern
        ];
      } else {
        // ✅ Fallback generic patterns - Smart extraction
        namePatterns = [
          /THIS CERTIFICATE IS AWARDED TO\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+for)/i,
          /PRESENTED TO\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+for)/i,
          /is presented to\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+has)/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+for the completion)/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+has successfully)/i
        ];
      }
      
      for (const pattern of namePatterns) {
        const match = cleanContent.match(pattern);
        if (match && match[1]) {
          const candidate = match[1].trim();
          console.log("🔍 [CertificateVerificationController] Name pattern match:", {
            pattern: pattern.toString(),
            candidate: candidate,
            length: candidate.length
          });
          
          // ✅ Smart filtering - ตรวจสอบว่า candidate เป็นชื่อจริงหรือไม่
          if (this.isValidName(candidate, certificateType)) {
            fullName = candidate;
            console.log("✅ [CertificateVerificationController] Name found:", fullName);
            break;
          }
        }
      }

      // ✅ Find course name - Conditional patterns based on certificate type
      let coursePatterns: RegExp[] = [];
      
      if (certificateType === 'THAI_MOOC') {
        // ✅ Thai MOOC specific patterns
        coursePatterns = [
          /for the completion and fulfillment of the online course\s*([^(]+)/i,
          /completion and fulfillment of the online course\s*([^(]+)/i,
          /online course\s*([^(]+)/i,
          /for the completion of\s*([^(]+)/i,
          /completion of\s*([^(]+)/i
        ];
      } else if (certificateType === 'BUU_MOOC') {
        // ✅ BUU MOOC specific patterns
        coursePatterns = [
          /has successfully completed the Open Online Course\s*([^(]+)/i,
          /Open Online Course\s*([^(]+)/i,
          /has successfully completed the (.+)/i,
          /completed the (.+)/i
        ];
      } else {
        // ✅ Fallback generic patterns
        coursePatterns = [
          /for the completion and fulfillment of the online course\s*([^(]+)/i,
          /has successfully completed the (.+)/i,
          /for the completion of\s*([^(]+)/i,
          /completion of\s*([^(]+)/i
        ];
      }
      
      for (const pattern of coursePatterns) {
        const match = cleanContent.match(pattern);
        if (match && match[1]) {
          const candidate = match[1].trim();
          console.log("🔍 [CertificateVerificationController] Course pattern match:", {
            pattern: pattern.toString(),
            candidate: candidate,
            length: candidate.length
          });
          if (!candidate.includes('THIS CERTIFICATE') && 
              !candidate.includes('AWARDED') && 
              !candidate.includes('COMPLETION') &&
              candidate.length > 3) {
            courseName = candidate;
            console.log("✅ [CertificateVerificationController] Course found:", courseName);
            break;
          }
        }
      }

      // ✅ Find teacher - Conditional patterns based on certificate type
      let teacherPatterns: RegExp[] = [];
      
      if (certificateType === 'THAI_MOOC') {
        // ✅ Thai MOOC specific patterns
        teacherPatterns = [
          /Awarded by\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+University/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+Project/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+Ministry/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+Department/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+Office/i,
          /Associate Professor\s+([A-Z][a-z]+ [A-Z][a-z]+)/i,
          /Director of ([^,]+)/i
        ];
      } else if (certificateType === 'BUU_MOOC') {
        // ✅ BUU MOOC specific patterns
        teacherPatterns = [
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+University/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+Institute/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+Language Institute/i,
          /Director\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+),\s*Ph\.D\./i,
          /Dr\.\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i
        ];
      } else {
        // ✅ Fallback generic patterns
        teacherPatterns = [
          /Awarded by\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+University/i,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+Institute/i,
          /Director of ([^,]+)/i,
          /([A-Z][a-z]+ [A-Z][a-z]+),\s*Ph\.D\./i
        ];
      }
      
      for (const pattern of teacherPatterns) {
        const match = cleanContent.match(pattern);
        if (match && match[1]) {
          const candidate = match[1].trim();
          console.log("🔍 [CertificateVerificationController] Teacher pattern match:", {
            pattern: pattern.toString(),
            candidate: candidate,
            length: candidate.length
          });
          if (!candidate.includes('Certificate') && 
              !candidate.includes('Basic') &&
              !candidate.includes('Communicative') &&
              !candidate.includes('English') &&
              !candidate.includes('Work') &&
              !candidate.includes('Course') &&
              !candidate.includes('Open') &&
              !candidate.includes('Online') &&
              !candidate.includes('Hours') &&
              !candidate.includes('10') &&
              candidate.length > 2 && 
              candidate.length < 50) {
            teacher = candidate;
            console.log("✅ [CertificateVerificationController] Teacher found:", teacher);
            break;
          }
        }
      }

      // ✅ Find date - Generic patterns ที่รองรับทุกรูปแบบวันที่
      const datePatterns = [
        /On\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/i, // ✅ Pattern สำหรับ "On June 29, 2025"
        /วันที่[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /Date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /on\s*(\d{1,2}\s+[A-Z][a-z]+\s+\d{4})/i, // ✅ Pattern สำหรับ "on DD Month YYYY"
        /(\d{1,2}\s+[A-Z][a-z]+\s+\d{4})/i, // ✅ Pattern สำหรับ "DD Month YYYY"
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i // ✅ Pattern สำหรับ "DD/MM/YYYY" or "DD-MM-YYYY"
      ];
      
      for (const pattern of datePatterns) {
        const match = cleanContent.match(pattern);
        if (match && match[1]) {
          console.log("🔍 [CertificateVerificationController] Date pattern match:", {
            pattern: pattern.toString(),
            candidate: match[1],
            length: match[1].length
          });
          date = match[1];
          console.log("✅ [CertificateVerificationController] Date found:", date);
          break;
        }
      }

      // ✅ Find Certificate ID - Conditional patterns based on certificate type
      if (certificateType === 'BUU_MOOC') {
        // ✅ BUU MOOC requires Certificate ID
        const certificateIdPatterns = [
          /Certificate ID Number\s*:\s*([a-f0-9]+)/i,
          /Certificate ID\s*:\s*([a-f0-9]+)/i,
          /ID Number\s*:\s*([a-f0-9]+)/i,
          /([a-f0-9]{32,})/i, // ✅ Generic pattern for long hex strings
          /https:\/\/mooc\.buu\.ac\.th\/certificates\/([a-f0-9]+)/i
        ];
        
        for (const pattern of certificateIdPatterns) {
          const match = cleanContent.match(pattern);
          if (match && match[1]) {
            console.log("🔍 [CertificateVerificationController] Certificate ID pattern match:", {
              pattern: pattern.toString(),
              candidate: match[1],
              length: match[1].length
            });
            certificateId = match[1];
            console.log("✅ [CertificateVerificationController] Certificate ID found:", certificateId);
            break;
          }
        }
      } else if (certificateType === 'THAI_MOOC') {
        // ✅ Thai MOOC doesn't require Certificate ID, but try to find if exists
        const certificateIdPatterns = [
          /Certificate ID Number\s*:\s*([a-f0-9]+)/i,
          /Certificate ID\s*:\s*([a-f0-9]+)/i,
          /ID Number\s*:\s*([a-f0-9]+)/i,
          /([a-f0-9]{32,})/i
        ];
        
        for (const pattern of certificateIdPatterns) {
          const match = cleanContent.match(pattern);
          if (match && match[1]) {
            console.log("🔍 [CertificateVerificationController] Certificate ID pattern match:", {
              pattern: pattern.toString(),
              candidate: match[1],
              length: match[1].length
            });
            certificateId = match[1];
            console.log("✅ [CertificateVerificationController] Certificate ID found:", certificateId);
            break;
          }
        }
      }
      // ✅ For UNKNOWN type, don't look for Certificate ID

      // ✅ เพิ่ม debug logging สำหรับผลลัพธ์สุดท้าย
      console.log("✅ [CertificateVerificationController] Final extraction results:", {
        fullName,
        courseName,
        teacher,
        certificateId,
        date,
        rawTextLength: rawContent.length
      });
      
      return {
        fullName,
        courseName,
        teacher,
        certificateId,
        date,
        rawText: cleanContent
      };
    } catch (error) {
      console.error("❌ [CertificateVerificationController] Error processing OCR result:", error);
      return {
        fullName: "-",
        courseName: "-",
        teacher: "-",
        certificateId: "-",
        date: "-",
        rawText: rawData?.toString() || ""
      };
    }
  };
}

// ✅ Export controller instance
const certificateVerificationController = new CertificateVerificationController();
export { certificateVerificationController };
