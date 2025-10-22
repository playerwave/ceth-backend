// src/utils/certificate-analyzer.ts
import { CertificateTemplate } from "../entity/certificate/certificate-template.entity";

/**
 * ผลการวิเคราะห์ Certificate
 */
export interface CertificateAnalysisResult {
  visual_analysis: {
    backgroundMatch: number;
    logoMatch: number;
    watermarkMatch: number;
    signatureMatch: number;
    layoutMatch: number;
  };
  content_analysis: {
    fieldCompleteness: number;
    formatConsistency: number;
    dataValidity: number;
    textQuality: number;
  };
  security_analysis: {
    qrCodeValid: boolean;
    securityElementsPresent: string[];
    securityElementsMissing: string[];
    tamperingDetected: boolean;
  };
  matchedFeatures: string[];
  failedFeatures: string[];
  recommendations: string[];
}

/**
 * วิเคราะห์ Visual Features ของใบรับรอง
 */
export function analyzeVisualFeatures(
  ocrData: any,
  template: CertificateTemplate
): {
  backgroundMatch: number;
  logoMatch: number;
  watermarkMatch: number;
  signatureMatch: number;
  layoutMatch: number;
} {
  console.log("🎨 [Certificate Analyzer] Analyzing visual features...");

  const rawText = ocrData?.results?.[0]?.message?.choices?.[0]?.message?.content || "";

  // Background Match: ตรวจสอบจากคำที่เกี่ยวข้องกับสี/พื้นหลัง
  let backgroundMatch = 50; // base score
  if (template.visual_features?.backgroundColor) {
    // TODO: Implement actual color detection from image
    // For now, check if background keywords exist in text
    if (rawText.toLowerCase().includes("background") || 
        rawText.toLowerCase().includes("certificate")) {
      backgroundMatch = 75;
    }
  }

  // Logo Match: ตรวจสอบการมีโลโก้
  let logoMatch = 50;
  const logoKeywords = [
    template.issuer_organization.toLowerCase(),
    "university", "logo", "seal", "emblem"
  ];
  
  for (const keyword of logoKeywords) {
    if (rawText.toLowerCase().includes(keyword)) {
      logoMatch += 10;
    }
  }
  logoMatch = Math.min(logoMatch, 100);

  // Watermark Match: ตรวจสอบลายน้ำ
  let watermarkMatch = 0;
  if (template.security_features?.hasWatermark) {
    if (rawText.toLowerCase().includes("watermark") || 
        rawText.toLowerCase().includes(template.issuer_organization.toLowerCase())) {
      watermarkMatch = 70;
    }
  } else {
    watermarkMatch = 100; // ไม่ต้องมีก็ผ่าน
  }

  // Signature Match: ตรวจสอบลายเซ็น
  let signatureMatch = 50;
  const signatureKeywords = ["signed", "signature", "director", "dean", "professor"];
  for (const keyword of signatureKeywords) {
    if (rawText.toLowerCase().includes(keyword)) {
      signatureMatch += 10;
    }
  }
  signatureMatch = Math.min(signatureMatch, 100);

  // Layout Match: ตรวจสอบโครงสร้าง
  let layoutMatch = 60;
  const structureKeywords = ["certificate", "awarded", "completion", "presented"];
  for (const keyword of structureKeywords) {
    if (rawText.toLowerCase().includes(keyword)) {
      layoutMatch += 10;
    }
  }
  layoutMatch = Math.min(layoutMatch, 100);

  console.log("✅ [Certificate Analyzer] Visual analysis complete:", {
    backgroundMatch,
    logoMatch,
    watermarkMatch,
    signatureMatch,
    layoutMatch
  });

  return {
    backgroundMatch,
    logoMatch,
    watermarkMatch,
    signatureMatch,
    layoutMatch
  };
}

/**
 * วิเคราะห์ Content ของใบรับรอง
 */
export function analyzeContent(
  ocrData: any,
  template: CertificateTemplate
): {
  fieldCompleteness: number;
  formatConsistency: number;
  dataValidity: number;
  textQuality: number;
} {
  console.log("📝 [Certificate Analyzer] Analyzing content...");

  const rawText = ocrData?.results?.[0]?.message?.choices?.[0]?.message?.content || "";
  const expectedFields = template.content_structure?.expectedFields || [];

  // Field Completeness: เช็คว่ามีฟิลด์ครบไหม
  let foundFields = 0;
  const fieldKeywords: { [key: string]: string[] } = {
    "student_name": ["awarded to", "presented to", "name"],
    "course_name": ["course", "program", "training"],
    "completion_date": ["date", "awarded by", "completed"],
    "certificate_id": ["id", "number", "certificate no"],
    "instructor": ["instructor", "teacher", "professor", "signed"]
  };

  for (const field of expectedFields) {
    const keywords = fieldKeywords[field] || [field];
    for (const keyword of keywords) {
      if (rawText.toLowerCase().includes(keyword.toLowerCase())) {
        foundFields++;
        break;
      }
    }
  }

  const fieldCompleteness = expectedFields.length > 0 
    ? (foundFields / expectedFields.length) * 100 
    : 80;

  // Format Consistency: เช็คความสม่ำเสมอของรูปแบบ
  let formatConsistency = 70;
  if (rawText.includes("Certificate") || rawText.includes("CERTIFICATE")) {
    formatConsistency += 10;
  }
  if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(rawText)) {
    formatConsistency += 10; // มี date format
  }
  if (/[A-Z][a-z]+ [A-Z][a-z]+/.test(rawText)) {
    formatConsistency += 10; // มี proper names
  }

  // Data Validity: เช็คความถูกต้องของข้อมูล
  let dataValidity = 80;
  
  // ตรวจสอบว่ามี organization ที่ถูกต้อง
  if (rawText.toLowerCase().includes(template.issuer_organization.toLowerCase())) {
    dataValidity += 10;
  }
  
  // ตรวจสอบว่ามี certificate type ที่ถูกต้อง
  if (template.certificate_type && 
      rawText.toLowerCase().includes(template.certificate_type.toLowerCase())) {
    dataValidity += 10;
  }

  // Text Quality: คุณภาพของข้อความ (ดูจากความยาวและโครงสร้าง)
  const textLength = rawText.length;
  let textQuality = 50;
  
  if (textLength > 100) textQuality += 10;
  if (textLength > 300) textQuality += 10;
  if (textLength > 500) textQuality += 10;
  if (rawText.split('\n').length > 5) textQuality += 10; // มีหลายบรรทัด
  if (!/[^\x00-\x7F]/.test(rawText) || /[ก-๙]/.test(rawText)) textQuality += 10; // มี unicode

  console.log("✅ [Certificate Analyzer] Content analysis complete:", {
    fieldCompleteness,
    formatConsistency,
    dataValidity,
    textQuality
  });

  return {
    fieldCompleteness: Math.min(fieldCompleteness, 100),
    formatConsistency: Math.min(formatConsistency, 100),
    dataValidity: Math.min(dataValidity, 100),
    textQuality: Math.min(textQuality, 100)
  };
}

/**
 * วิเคราะห์ Security Features
 */
export function analyzeSecurity(
  ocrData: any,
  template: CertificateTemplate
): {
  qrCodeValid: boolean;
  securityElementsPresent: string[];
  securityElementsMissing: string[];
  tamperingDetected: boolean;
} {
  console.log("🔒 [Certificate Analyzer] Analyzing security features...");

  const rawText = ocrData?.results?.[0]?.message?.choices?.[0]?.message?.content || "";
  const expectedSecurityElements = template.security_features?.securityElements || [];

  const securityElementsPresent: string[] = [];
  const securityElementsMissing: string[] = [];

  // ตรวจสอบ Security Elements แต่ละตัว
  const securityKeywords: { [key: string]: string[] } = {
    "watermark": ["watermark", template.issuer_organization.toLowerCase()],
    "signature": ["signature", "signed", "authorized"],
    "qr_code": ["qr", "code", "scan", "verify"],
    "seal": ["seal", "stamp", "official"],
    "hologram": ["hologram", "security"]
  };

  for (const element of expectedSecurityElements) {
    const keywords = securityKeywords[element.toLowerCase()] || [element];
    let found = false;
    
    for (const keyword of keywords) {
      if (rawText.toLowerCase().includes(keyword)) {
        securityElementsPresent.push(element);
        found = true;
        break;
      }
    }
    
    if (!found) {
      securityElementsMissing.push(element);
    }
  }

  // QR Code validation
  const qrCodeValid = rawText.toLowerCase().includes("qr") || 
                      rawText.toLowerCase().includes("scan") ||
                      rawText.toLowerCase().includes("verify");

  // Tampering detection (basic check)
  let tamperingDetected = false;
  
  // Check for suspicious patterns
  if (rawText.includes("FAKE") || 
      rawText.includes("COPY") || 
      rawText.includes("DUPLICATE") ||
      rawText.includes("UNOFFICIAL")) {
    tamperingDetected = true;
  }
  
  // Check for missing critical elements
  if (securityElementsMissing.length > expectedSecurityElements.length * 0.5) {
    tamperingDetected = true;
  }

  console.log("✅ [Certificate Analyzer] Security analysis complete:", {
    qrCodeValid,
    securityElementsPresent,
    securityElementsMissing,
    tamperingDetected
  });

  return {
    qrCodeValid,
    securityElementsPresent,
    securityElementsMissing,
    tamperingDetected
  };
}

/**
 * คำนวณ Confidence Score รวม
 */
export function calculateConfidenceScore(
  visualAnalysis: any,
  contentAnalysis: any,
  securityAnalysis: any
): number {
  console.log("🎯 [Certificate Analyzer] Calculating confidence score...");

  // Visual Analysis (30%)
  const visualScore = (
    visualAnalysis.backgroundMatch +
    visualAnalysis.logoMatch +
    visualAnalysis.watermarkMatch +
    visualAnalysis.signatureMatch +
    visualAnalysis.layoutMatch
  ) / 5;

  // Content Analysis (40%)
  const contentScore = (
    contentAnalysis.fieldCompleteness +
    contentAnalysis.formatConsistency +
    contentAnalysis.dataValidity +
    contentAnalysis.textQuality
  ) / 4;

  // Security Analysis (30%)
  let securityScore = 50; // base score
  
  if (securityAnalysis.qrCodeValid) securityScore += 15;
  if (securityAnalysis.securityElementsPresent.length > 0) {
    securityScore += securityAnalysis.securityElementsPresent.length * 10;
  }
  if (securityAnalysis.tamperingDetected) securityScore -= 40;
  
  securityScore = Math.max(0, Math.min(100, securityScore));

  // Weighted average
  const confidenceScore = (
    visualScore * 0.3 +
    contentScore * 0.4 +
    securityScore * 0.3
  );

  console.log("✅ [Certificate Analyzer] Confidence score calculated:", {
    visualScore: visualScore.toFixed(2),
    contentScore: contentScore.toFixed(2),
    securityScore: securityScore.toFixed(2),
    finalScore: confidenceScore.toFixed(2)
  });

  return Math.round(confidenceScore);
}

/**
 * สร้างคำแนะนำจากผลการวิเคราะห์
 */
export function generateRecommendations(
  visualAnalysis: any,
  contentAnalysis: any,
  securityAnalysis: any,
  confidenceScore: number
): string[] {
  const recommendations: string[] = [];

  // Overall score
  if (confidenceScore < 50) {
    recommendations.push("⚠️ ใบรับรองมีความเสี่ยงสูงมาก ควรตรวจสอบด้วยตนเอง");
  } else if (confidenceScore < 70) {
    recommendations.push("⚠️ ใบรับรองมีความเสี่ยงปานกลาง ควรตรวจสอบเพิ่มเติม");
  }

  // Visual issues
  if (visualAnalysis.backgroundMatch < 60) {
    recommendations.push("🎨 พื้นหลังไม่ตรงกับเทมเพลต");
  }
  if (visualAnalysis.logoMatch < 60) {
    recommendations.push("🖼️ ไม่พบโลโก้หรือโลโก้ไม่ตรงกับเทมเพลต");
  }
  if (visualAnalysis.watermarkMatch < 60) {
    recommendations.push("💧 ไม่พบลายน้ำ");
  }
  if (visualAnalysis.signatureMatch < 60) {
    recommendations.push("✍️ ลายเซ็นไม่ชัดเจนหรือไม่ตรงกับเทมเพลต");
  }

  // Content issues
  if (contentAnalysis.fieldCompleteness < 70) {
    recommendations.push("📝 ข้อมูลไม่ครบถ้วน");
  }
  if (contentAnalysis.formatConsistency < 70) {
    recommendations.push("📋 รูปแบบไม่สอดคล้อง");
  }
  if (contentAnalysis.dataValidity < 70) {
    recommendations.push("⚠️ ข้อมูลอาจไม่ถูกต้อง");
  }

  // Security issues
  if (!securityAnalysis.qrCodeValid) {
    recommendations.push("🔍 ไม่พบ QR Code หรือ QR Code ไม่ถูกต้อง");
  }
  if (securityAnalysis.securityElementsMissing.length > 0) {
    recommendations.push(
      `🔒 ขาดองค์ประกอบความปลอดภัย: ${securityAnalysis.securityElementsMissing.join(", ")}`
    );
  }
  if (securityAnalysis.tamperingDetected) {
    recommendations.push("🚨 ตรวจพบสัญญาณการปลอมแปลง");
  }

  // Positive feedback
  if (confidenceScore >= 80) {
    recommendations.push("✅ ใบรับรองมีความน่าเชื่อถือสูง");
  }

  return recommendations;
}

/**
 * วิเคราะห์ Certificate แบบสมบูรณ์
 */
export function analyzeCertificate(
  ocrData: any,
  template: CertificateTemplate
): CertificateAnalysisResult {
  console.log("🔍 [Certificate Analyzer] Starting full certificate analysis...");

  // 1. Visual Analysis
  const visualAnalysis = analyzeVisualFeatures(ocrData, template);

  // 2. Content Analysis
  const contentAnalysis = analyzeContent(ocrData, template);

  // 3. Security Analysis
  const securityAnalysis = analyzeSecurity(ocrData, template);

  // 4. Calculate Confidence Score
  const confidenceScore = calculateConfidenceScore(
    visualAnalysis,
    contentAnalysis,
    securityAnalysis
  );

  // 5. Generate Recommendations
  const recommendations = generateRecommendations(
    visualAnalysis,
    contentAnalysis,
    securityAnalysis,
    confidenceScore
  );

  // 6. Determine matched and failed features
  const matchedFeatures: string[] = [];
  const failedFeatures: string[] = [];

  // Visual features
  if (visualAnalysis.backgroundMatch >= 70) matchedFeatures.push("background");
  else failedFeatures.push("background");

  if (visualAnalysis.logoMatch >= 70) matchedFeatures.push("logo");
  else failedFeatures.push("logo");

  if (visualAnalysis.watermarkMatch >= 70) matchedFeatures.push("watermark");
  else failedFeatures.push("watermark");

  if (visualAnalysis.signatureMatch >= 70) matchedFeatures.push("signature");
  else failedFeatures.push("signature");

  if (visualAnalysis.layoutMatch >= 70) matchedFeatures.push("layout");
  else failedFeatures.push("layout");

  console.log("✅ [Certificate Analyzer] Analysis complete:", {
    confidenceScore,
    matchedFeatures: matchedFeatures.length,
    failedFeatures: failedFeatures.length
  });

  return {
    visual_analysis: visualAnalysis,
    content_analysis: contentAnalysis,
    security_analysis: securityAnalysis,
    matchedFeatures,
    failedFeatures,
    recommendations
  };
}

