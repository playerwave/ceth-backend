// src/services/Student/certificate-verification.service.ts
import { CertificateVerificationDAO } from "../../daos/Student/certificate-verification.dao";
import { CertificateBase } from "../../entity/certificate/certificate-base.entity";
import { ErrorHandledService } from "../error.handdled.service";

// ✅ Interface สำหรับผลการตรวจสอบ
export interface CertificateVerificationResult {
  success: boolean;
  confidenceScore: number;
  isAuthentic: boolean;
  matchedFeatures: string[];
  failedFeatures: string[];
  recommendations: string[];
  ocrData: {
    fullName: string;
    courseName: string;
    teacher: string;
    certificateId: string;
    date: string;
    rawText: string;
  };
  verificationDetails: {
    courseNameMatch: number;
    instructorMatch: number;
    visualMatch: number;
    formatMatch: number;
  };
}

// ✅ Interface สำหรับข้อมูล OCR
export interface OcrResult {
  fullName: string;
  courseName: string;
  teacher: string;
  certificateId: string;
  date: string;
  rawText: string;
}

// ✅ Interface สำหรับการเปรียบเทียบ
export interface ComparisonResult {
  courseNameMatch: number;
  instructorMatch: number;
  visualMatch: number;
  formatMatch: number;
  overallConfidence: number;
}

export class CertificateVerificationService extends ErrorHandledService {
  private certificateVerificationDAO: CertificateVerificationDAO;

  constructor() {
    super();
    this.certificateVerificationDAO = new CertificateVerificationDAO();
  }

  // ✅ ดึง CertificateBase ของกิจกรรม
  public async getCertificateBaseByActivityId(activityId: number): Promise<CertificateBase | null> {
    try {
      console.log("🔍 [CertificateVerificationService] Getting certificate base for activity:", activityId);
      
      const certificateBase = await this.certificateVerificationDAO.getCertificateBaseByActivityId(activityId);
      
      if (!certificateBase) {
        console.log("⚠️ [CertificateVerificationService] No certificate base found for activity:", activityId);
        return null;
      }
      
      console.log("✅ [CertificateVerificationService] Certificate base found:", {
        certificate_base_id: certificateBase.certificate_base_id,
        certificate_name: certificateBase.certificate_name,
        has_ocr_data: !!certificateBase.ocr_data,
        has_image_analysis: !!certificateBase.image_analysis
      });
      
      return certificateBase;
    } catch (error) {
      this.logError("❌ Error getting certificate base", error);
      throw error;
    }
  }

  // ✅ เปรียบเทียบ OCR กับ Template
  public async compareOcrWithTemplate(
    ocrResult: OcrResult,
    certificateBase: CertificateBase,
    certificateType?: 'THAI_MOOC' | 'BUU_MOOC' | 'UNKNOWN'
  ): Promise<CertificateVerificationResult> {
    try {
      console.log("🔍 [CertificateVerificationService] Comparing OCR with template");
      console.log("🔍 [CertificateVerificationService] Certificate type:", certificateType);
      
      // ✅ เปรียบเทียบข้อมูล
      const comparisonResult = await this.performComparison(ocrResult, certificateBase);
      
      // ✅ ตรวจสอบ Certificate ID
      const hasCertificateId = ocrResult.certificateId && ocrResult.certificateId !== '-';
      console.log("🔍 [CertificateVerificationService] Has Certificate ID:", hasCertificateId);
      
      // ✅ คำนวณ confidence score
      const confidenceScore = this.calculateConfidenceScore(comparisonResult, certificateType, hasCertificateId);
      
      // ✅ ตรวจสอบความถูกต้อง
      const isAuthentic = confidenceScore >= 70; // 70% ขึ้นไปถือว่า authentic
      
      // ✅ ระบุ matched/failed features
      const { matchedFeatures, failedFeatures } = this.analyzeFeatures(comparisonResult);
      
      // ✅ สร้าง recommendations
      const recommendations = this.generateRecommendations(comparisonResult, isAuthentic);
      
      const result: CertificateVerificationResult = {
        success: true,
        confidenceScore,
        isAuthentic,
        matchedFeatures,
        failedFeatures,
        recommendations,
        ocrData: ocrResult,
        verificationDetails: {
          courseNameMatch: comparisonResult.courseNameMatch,
          instructorMatch: comparisonResult.instructorMatch,
          visualMatch: comparisonResult.visualMatch,
          formatMatch: comparisonResult.formatMatch
        }
      };
      
      console.log("✅ [CertificateVerificationService] Verification completed:", {
        confidenceScore,
        isAuthentic,
        matchedFeatures: matchedFeatures.length,
        failedFeatures: failedFeatures.length
      });
      
      return result;
    } catch (error) {
      this.logError("❌ Error comparing OCR with template", error);
      throw error;
    }
  }

  // ✅ Extract ข้อมูลจาก template natural_text
  private extractCourseNameFromTemplate(naturalText: string): string {
    if (!naturalText) return "";
    
    // ✅ หาชื่อหลักสูตรจาก template
    const coursePattern = /for the completion and fulfillment of the online course\s*([^(]+)/i;
    const match = naturalText.match(coursePattern);
    return match ? match[1].trim() : "";
  }

  private extractInstructorNameFromTemplate(naturalText: string): string {
    if (!naturalText) return "";
    
    // ✅ หาชื่ออาจารย์จาก template
    const instructorPattern = /Awarded by\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
    const match = naturalText.match(instructorPattern);
    return match ? match[1].trim() : "";
  }

  private extractStudentNameFromTemplate(naturalText: string): string {
    if (!naturalText) return "";
    
    // ✅ หาชื่อนิสิตจาก template
    const namePattern = /THIS CERTIFICATE IS AWARDED TO\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s+for)/i;
    const match = naturalText.match(namePattern);
    return match ? match[1].trim() : "";
  }

  private extractDateFromTemplate(naturalText: string): string {
    if (!naturalText) return "";
    
    // ✅ หาวันที่จาก template
    const datePattern = /on\s*(\d{1,2}\s+[A-Z][a-z]+\s+\d{4})/i;
    const match = naturalText.match(datePattern);
    return match ? match[1].trim() : "";
  }

  // ✅ เปรียบเทียบข้อมูล
  private async performComparison(
    ocrResult: OcrResult,
    certificateBase: CertificateBase
  ): Promise<ComparisonResult> {
    const templateData = certificateBase.ocr_data;
    
    console.log("🔍 [CertificateVerificationService] Starting field-by-field comparison...");
    console.log("📋 [CertificateVerificationService] OCR Result Data:", {
      fullName: ocrResult.fullName,
      courseName: ocrResult.courseName,
      teacher: ocrResult.teacher,
      certificateId: ocrResult.certificateId,
      date: ocrResult.date,
      rawText: ocrResult.rawText?.substring(0, 200) + "..."
    });
    
    console.log("📋 [CertificateVerificationService] Template Data:", {
      student_name: templateData?.student_name,
      course_name: templateData?.course_name,
      instructor_name: templateData?.instructor_name,
      certificate_id: templateData?.certificate_id,
      completion_date: templateData?.completion_date,
      raw_text: templateData?.raw_text?.substring(0, 200) + "...",
      natural_text: templateData?.natural_text?.substring(0, 200) + "...",
      extracted_fields: templateData?.extracted_fields,
      processing_time: templateData?.processing_time,
      total_pages: templateData?.total_pages
    });
    
    // ✅ เปรียบเทียบชื่อหลักสูตร
    console.log("🔍 [CertificateVerificationService] Comparing Course Name...");
    
    // ✅ ใช้ natural_text จาก template แทน course_name
    const templateCourseName = this.extractCourseNameFromTemplate(templateData?.natural_text || "");
    
    console.log("📊 [CertificateVerificationService] Course Name Comparison:", {
      ocrCourseName: ocrResult.courseName,
      templateCourseName: templateCourseName,
      ocrLength: ocrResult.courseName.length,
      templateLength: templateCourseName.length
    });
    
    const courseNameMatch = this.calculateStringSimilarity(
      ocrResult.courseName,
      templateCourseName
    );
    
    console.log("✅ [CertificateVerificationService] Course Name Match Score:", courseNameMatch);
    
    // ✅ เปรียบเทียบชื่ออาจารย์
    console.log("🔍 [CertificateVerificationService] Comparing Instructor Name...");
    
    // ✅ ใช้ natural_text จาก template แทน instructor_name
    const templateInstructorName = this.extractInstructorNameFromTemplate(templateData?.natural_text || "");
    
    console.log("📊 [CertificateVerificationService] Instructor Name Comparison:", {
      ocrTeacher: ocrResult.teacher,
      templateInstructor: templateInstructorName,
      ocrLength: ocrResult.teacher.length,
      templateLength: templateInstructorName.length
    });
    
    const instructorMatch = this.calculateStringSimilarity(
      ocrResult.teacher,
      templateInstructorName
    );
    
    console.log("✅ [CertificateVerificationService] Instructor Name Match Score:", instructorMatch);
    
    // ✅ เปรียบเทียบชื่อนิสิต
    console.log("🔍 [CertificateVerificationService] Comparing Student Name...");
    
    // ✅ ใช้ natural_text จาก template แทน student_name
    const templateStudentName = this.extractStudentNameFromTemplate(templateData?.natural_text || "");
    
    console.log("📊 [CertificateVerificationService] Student Name Comparison:", {
      ocrFullName: ocrResult.fullName,
      templateStudentName: templateStudentName,
      ocrLength: ocrResult.fullName.length,
      templateLength: templateStudentName.length
    });
    
    const studentNameMatch = this.calculateStringSimilarity(
      ocrResult.fullName,
      templateStudentName
    );
    
    console.log("✅ [CertificateVerificationService] Student Name Match Score:", studentNameMatch);
    
    // ✅ เปรียบเทียบวันที่
    console.log("🔍 [CertificateVerificationService] Comparing Date...");
    
    // ✅ ใช้ natural_text จาก template แทน completion_date
    const templateDate = this.extractDateFromTemplate(templateData?.natural_text || "");
    
    console.log("📊 [CertificateVerificationService] Date Comparison:", {
      ocrDate: ocrResult.date,
      templateDate: templateDate,
      ocrLength: ocrResult.date.length,
      templateLength: templateDate.length
    });
    
    const dateMatch = this.calculateStringSimilarity(
      ocrResult.date,
      templateDate
    );
    
    console.log("✅ [CertificateVerificationService] Date Match Score:", dateMatch);
    
    // ✅ เปรียบเทียบ Certificate ID (THAI MOOC ไม่มี Certificate ID)
    console.log("🔍 [CertificateVerificationService] Comparing Certificate ID...");
    console.log("📊 [CertificateVerificationService] Certificate ID Comparison:", {
      ocrCertificateId: ocrResult.certificateId,
      templateCertificateId: "-", // THAI MOOC ไม่มี Certificate ID
      ocrLength: ocrResult.certificateId.length,
      templateLength: 1
    });
    
    // ✅ สำหรับ THAI MOOC ไม่ต้องเปรียบเทียบ Certificate ID
    const certificateIdMatch = ocrResult.certificateId === "-" ? 100 : 0;
    
    console.log("✅ [CertificateVerificationService] Certificate ID Match Score:", certificateIdMatch);
    
    // ✅ เปรียบเทียบการวิเคราะห์รูปภาพ (ถ้ามี)
    console.log("🔍 [CertificateVerificationService] Comparing Image Analysis...");
    const visualMatch = this.compareImageAnalysis(
      ocrResult,
      certificateBase.image_analysis
    );
    console.log("✅ [CertificateVerificationService] Visual Match Score:", visualMatch);
    
    // ✅ เปรียบเทียบรูปแบบ (format)
    console.log("🔍 [CertificateVerificationService] Comparing Format...");
    const formatMatch = this.compareFormat(ocrResult, templateData);
    console.log("✅ [CertificateVerificationService] Format Match Score:", formatMatch);
    
    const overallConfidence = (
      courseNameMatch * 0.4 +
      instructorMatch * 0.3 +
      visualMatch * 0.2 +
      formatMatch * 0.1
    );
    
    console.log("📊 [CertificateVerificationService] Overall Confidence Calculation:", {
      courseNameMatch,
      instructorMatch,
      visualMatch,
      formatMatch,
      overallConfidence,
      weights: {
        courseName: 0.4,
        instructor: 0.3,
        visual: 0.2,
        format: 0.1
      }
    });
    
    return {
      courseNameMatch,
      instructorMatch,
      visualMatch,
      formatMatch,
      overallConfidence
    };
  }

  // ✅ คำนวณความคล้ายคลึงของ string
  private calculateStringSimilarity(str1: string, str2: string): number {
    console.log("🔍 [CertificateVerificationService] Calculating string similarity:", {
      originalStr1: str1,
      originalStr2: str2,
      str1Length: str1?.length || 0,
      str2Length: str2?.length || 0
    });
    
    if (!str1 || !str2) {
      console.log("❌ [CertificateVerificationService] Empty strings, returning 0");
      return 0;
    }
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    console.log("🔍 [CertificateVerificationService] Normalized strings:", {
      normalizedStr1: s1,
      normalizedStr2: s2,
      normalizedLength1: s1.length,
      normalizedLength2: s2.length
    });
    
    if (s1 === s2) {
      console.log("✅ [CertificateVerificationService] Exact match, returning 100");
      return 100;
    }
    
    // ✅ ใช้ Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    
    console.log("🔍 [CertificateVerificationService] Levenshtein calculation:", {
      distance,
      maxLength,
      str1Length: s1.length,
      str2Length: s2.length
    });
    
    if (maxLength === 0) {
      console.log("✅ [CertificateVerificationService] Max length is 0, returning 100");
      return 100;
    }
    
    const similarity = ((maxLength - distance) / maxLength) * 100;
    const finalSimilarity = Math.max(0, Math.min(100, similarity));
    
    console.log("✅ [CertificateVerificationService] Final similarity score:", {
      similarity,
      finalSimilarity,
      percentage: `${finalSimilarity.toFixed(2)}%`
    });
    
    return finalSimilarity;
  }

  // ✅ Levenshtein distance algorithm
  private levenshteinDistance(str1: string, str2: string): number {
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
  }

  // ✅ เปรียบเทียบการวิเคราะห์รูปภาพ
  private compareImageAnalysis(
    ocrResult: OcrResult,
    imageAnalysis: CertificateBase['image_analysis']
  ): number {
    if (!imageAnalysis) return 50; // ถ้าไม่มีข้อมูล template ให้คะแนนกลาง
    
    // ✅ ตรวจสอบ dominant colors
    const colorMatch = this.compareColors(imageAnalysis.dominantColors);
    
    // ✅ ตรวจสอบ watermark
    const watermarkMatch = imageAnalysis.watermark?.detected ? 80 : 20;
    
    // ✅ ตรวจสอบ signature
    const signatureMatch = imageAnalysis.signature?.detected ? 80 : 20;
    
    return (colorMatch + watermarkMatch + signatureMatch) / 3;
  }

  // ✅ เปรียบเทียบสี
  private compareColors(dominantColors: CertificateBase['image_analysis']['dominantColors']): number {
    if (!dominantColors) return 50;
    
    // ✅ ตรวจสอบสีหลัก (ตัวอย่าง)
    const expectedColors = ['#ffffff', '#f0f0f0', '#e0e0e0']; // สีที่คาดหวัง
    const actualColor = dominantColors.dominant;
    
    // ✅ เปรียบเทียบสี (simplified)
    if (expectedColors.includes(actualColor.toLowerCase())) {
      return 90;
    }
    
    return 60; // คะแนนกลาง
  }

  // ✅ เปรียบเทียบรูปแบบ
  private compareFormat(
    ocrResult: OcrResult,
    templateData: CertificateBase['ocr_data']
  ): number {
    console.log("🔍 [CertificateVerificationService] Comparing Format...");
    console.log("📊 [CertificateVerificationService] Format Comparison Data:", {
      hasTemplateData: !!templateData,
      templateDataKeys: templateData ? Object.keys(templateData) : []
    });
    
    if (!templateData) {
      console.log("⚠️ [CertificateVerificationService] No template data, returning 50");
      return 50;
    }
    
    // ✅ ตรวจสอบความสมบูรณ์ของข้อมูล
    const requiredFields = ['fullName', 'courseName', 'teacher', 'date'];
    const ocrFields = [
      ocrResult.fullName,
      ocrResult.courseName,
      ocrResult.teacher,
      ocrResult.date
    ];
    
    console.log("📊 [CertificateVerificationService] Field Completeness Check:", {
      requiredFields,
      ocrFields,
      fieldValues: {
        fullName: ocrResult.fullName,
        courseName: ocrResult.courseName,
        teacher: ocrResult.teacher,
        date: ocrResult.date
      }
    });
    
    const filledFields = ocrFields.filter(field => field && field !== '-').length;
    const completeness = (filledFields / requiredFields.length) * 100;
    
    console.log("✅ [CertificateVerificationService] Format Completeness Score:", {
      filledFields,
      totalFields: requiredFields.length,
      completeness,
      percentage: `${completeness.toFixed(2)}%`
    });
    
    return completeness;
  }

  // ✅ คำนวณ confidence score - ปรับปรุงให้รองรับ certificate type
  private calculateConfidenceScore(
    comparisonResult: ComparisonResult, 
    certificateType?: 'THAI_MOOC' | 'BUU_MOOC' | 'UNKNOWN',
    hasCertificateId?: boolean
  ): number {
    console.log("🔍 [CertificateVerificationService] Calculating Confidence Score...");
    console.log("📊 [CertificateVerificationService] Input Parameters:", {
      certificateType,
      hasCertificateId,
      comparisonResult: {
        courseNameMatch: comparisonResult.courseNameMatch,
        instructorMatch: comparisonResult.instructorMatch,
        visualMatch: comparisonResult.visualMatch,
        formatMatch: comparisonResult.formatMatch,
        overallConfidence: comparisonResult.overallConfidence
      }
    });
    
    let baseScore = Math.round(comparisonResult.overallConfidence);
    console.log("📊 [CertificateVerificationService] Base Score:", baseScore);
    
    // ✅ ปรับคะแนนตาม certificate type
    if (certificateType === 'THAI_MOOC') {
      // ✅ Thai MOOC: Certificate ID is optional
      if (!hasCertificateId) {
        baseScore += 10; // ✅ Bonus for Thai MOOC without ID
        console.log("✅ [CertificateVerificationService] Thai MOOC bonus applied (+10)");
      } else {
        console.log("ℹ️ [CertificateVerificationService] Thai MOOC with Certificate ID (no bonus)");
      }
    } else if (certificateType === 'BUU_MOOC') {
      // ✅ BUU MOOC: Certificate ID is required
      if (!hasCertificateId) {
        baseScore -= 20; // ✅ Penalty for BUU MOOC without ID
        console.log("⚠️ [CertificateVerificationService] BUU MOOC penalty applied (-20)");
      } else {
        baseScore += 15; // ✅ Bonus for BUU MOOC with ID
        console.log("✅ [CertificateVerificationService] BUU MOOC bonus applied (+15)");
      }
    } else {
      console.log("ℹ️ [CertificateVerificationService] Unknown certificate type (no adjustments)");
    }
    
    // ✅ Ensure score is within valid range
    const finalScore = Math.max(0, Math.min(100, baseScore));
    console.log("✅ [CertificateVerificationService] Final Confidence Score:", {
      baseScore,
      finalScore,
      percentage: `${finalScore}%`
    });
    
    return finalScore;
  }

  // ✅ วิเคราะห์ features
  private analyzeFeatures(comparisonResult: ComparisonResult): {
    matchedFeatures: string[];
    failedFeatures: string[];
  } {
    const matchedFeatures: string[] = [];
    const failedFeatures: string[] = [];
    
    if (comparisonResult.courseNameMatch >= 70) {
      matchedFeatures.push("Course Name");
    } else {
      failedFeatures.push("Course Name");
    }
    
    if (comparisonResult.instructorMatch >= 70) {
      matchedFeatures.push("Instructor Name");
    } else {
      failedFeatures.push("Instructor Name");
    }
    
    if (comparisonResult.visualMatch >= 70) {
      matchedFeatures.push("Visual Analysis");
    } else {
      failedFeatures.push("Visual Analysis");
    }
    
    if (comparisonResult.formatMatch >= 70) {
      matchedFeatures.push("Format");
    } else {
      failedFeatures.push("Format");
    }
    
    return { matchedFeatures, failedFeatures };
  }

  // ✅ สร้าง recommendations
  private generateRecommendations(
    comparisonResult: ComparisonResult,
    isAuthentic: boolean
  ): string[] {
    const recommendations: string[] = [];
    
    if (!isAuthentic) {
      recommendations.push("ใบรับรองนี้อาจไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
    }
    
    if (comparisonResult.courseNameMatch < 70) {
      recommendations.push("ชื่อหลักสูตรไม่ตรงกับที่คาดหวัง");
    }
    
    if (comparisonResult.instructorMatch < 70) {
      recommendations.push("ชื่ออาจารย์ไม่ตรงกับที่คาดหวัง");
    }
    
    if (comparisonResult.visualMatch < 70) {
      recommendations.push("การวิเคราะห์รูปภาพแสดงความแตกต่าง");
    }
    
    if (comparisonResult.formatMatch < 70) {
      recommendations.push("รูปแบบใบรับรองไม่สมบูรณ์");
    }
    
    if (isAuthentic && recommendations.length === 0) {
      recommendations.push("ใบรับรองนี้ถูกต้องและน่าเชื่อถือ");
    }
    
    return recommendations;
  }
}
