// src/utils/post-ocr-correction.ts
/**
 * Post-OCR Correction สำหรับแก้ไขข้อผิดพลาดที่พบบ่อยในภาษาไทย
 * โดยเฉพาะสำหรับ BUU MOOC Certificate
 */
import { 
  ORGANIZATION_CORRECTIONS, 
  INSTRUCTOR_CORRECTIONS, 
  TITLE_CORRECTIONS,
  applyCorrections 
} from './certificateCorrections.config';

interface CorrectionRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

interface ThaiNameCorrection {
  incorrect: string;
  correct: string;
  confidence: number;
}

// ✅ กฎการแก้ไขข้อผิดพลาดที่พบบ่อย
const COMMON_CORRECTIONS: CorrectionRule[] = [
  // แก้ไขข้อผิดพลาดในชื่อหลักสูตร
  {
    pattern: /การประประยุกต์ใช้/g,
    replacement: 'การประยุกต์ใช้',
    description: 'แก้ไข "ประประยุกต์" เป็น "ประยุกต์"'
  },
  {
    pattern: /Generative AI/g,
    replacement: 'Generative AI',
    description: 'รักษาการสะกด Generative AI'
  },
  
  // แก้ไขข้อผิดพลาดในชื่อมหาวิทยาลัย (ใช้ configuration)
  ...ORGANIZATION_CORRECTIONS.map(correction => ({
    pattern: new RegExp(correction.incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    replacement: correction.correct,
    description: correction.description
  })),
  
  // แก้ไขข้อผิดพลาดในตำแหน่ง (ใช้ configuration)
  ...TITLE_CORRECTIONS.map(correction => ({
    pattern: new RegExp(correction.incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    replacement: correction.correct,
    description: correction.description
  })),
  
  // แก้ไขข้อผิดพลาดทั่วไป
  {
    pattern: /CERTIFICATE OF BUU MOOC/g,
    replacement: 'CERTIFICATE OF BUU MOOC',
    description: 'รักษาการสะกด CERTIFICATE OF BUU MOOC'
  },
  {
    pattern: /is presented to/g,
    replacement: 'is presented to',
    description: 'รักษาการสะกด is presented to'
  },
  {
    pattern: /has successfully completed the Open Online Course/g,
    replacement: 'has successfully completed the Open Online Course',
    description: 'รักษาการสะกด has successfully completed the Open Online Course'
  }
];

// ✅ ฐานข้อมูลชื่อที่ถูกต้องสำหรับ BUU MOOC (ใช้ configuration)
const THAI_NAME_CORRECTIONS: ThaiNameCorrection[] = INSTRUCTOR_CORRECTIONS.map(correction => ({
  incorrect: correction.incorrect,
  correct: correction.correct,
  confidence: 0.9
}));

/**
 * แก้ไขข้อผิดพลาดใน natural_text ที่ได้จาก OCR
 */
export function correctOCRText(naturalText: string): string {
  if (!naturalText || typeof naturalText !== 'string') {
    return naturalText;
  }

  console.log('🔧 [Post-OCR Correction] Starting correction for text length:', naturalText.length);
  
  let correctedText = naturalText;
  let correctionCount = 0;

  // ✅ ใช้กฎการแก้ไขทั่วไป
  for (const rule of COMMON_CORRECTIONS) {
    const beforeLength = correctedText.length;
    correctedText = correctedText.replace(rule.pattern, rule.replacement);
    
    if (correctedText.length !== beforeLength) {
      console.log(`✅ [Post-OCR Correction] Applied rule: ${rule.description}`);
      correctionCount++;
    }
  }

  // ✅ แก้ไขชื่อที่ผิดเพี้ยน
  for (const nameCorrection of THAI_NAME_CORRECTIONS) {
    if (correctedText.includes(nameCorrection.incorrect)) {
      correctedText = correctedText.replace(
        new RegExp(nameCorrection.incorrect, 'g'),
        nameCorrection.correct
      );
      console.log(`✅ [Post-OCR Correction] Corrected name: ${nameCorrection.incorrect} → ${nameCorrection.correct}`);
      correctionCount++;
    }
  }

  console.log(`🎉 [Post-OCR Correction] Applied ${correctionCount} corrections`);
  
  return correctedText;
}

/**
 * แก้ไขข้อมูลที่ extract จาก OCR result
 */
export function correctExtractedData(extractedData: any): any {
  if (!extractedData || typeof extractedData !== 'object') {
    return extractedData;
  }

  console.log('🔧 [Post-OCR Correction] Correcting extracted data...');
  
  const corrected = { ...extractedData };
  let correctionCount = 0;

  // ✅ แก้ไข course_name
  if (corrected.course_name) {
    const originalCourseName = corrected.course_name;
    corrected.course_name = correctOCRText(originalCourseName);
    if (corrected.course_name !== originalCourseName) {
      console.log(`✅ [Post-OCR Correction] Corrected course_name: ${originalCourseName} → ${corrected.course_name}`);
      correctionCount++;
    }
  }

  // ✅ แก้ไข instructor_name
  if (corrected.instructor_name) {
    const originalInstructorName = corrected.instructor_name;
    corrected.instructor_name = correctOCRText(originalInstructorName);
    if (corrected.instructor_name !== originalInstructorName) {
      console.log(`✅ [Post-OCR Correction] Corrected instructor_name: ${originalInstructorName} → ${corrected.instructor_name}`);
      correctionCount++;
    }
  }

  // ✅ แก้ไข university_name
  if (corrected.university_name) {
    const originalUniversityName = corrected.university_name;
    corrected.university_name = correctOCRText(originalUniversityName);
    if (corrected.university_name !== originalUniversityName) {
      console.log(`✅ [Post-OCR Correction] Corrected university_name: ${originalUniversityName} → ${corrected.university_name}`);
      correctionCount++;
    }
  }

  // ✅ แก้ไข raw_text
  if (corrected.raw_text) {
    const originalRawText = corrected.raw_text;
    corrected.raw_text = correctOCRText(originalRawText);
    if (corrected.raw_text !== originalRawText) {
      console.log(`✅ [Post-OCR Correction] Corrected raw_text (length: ${corrected.raw_text.length})`);
      correctionCount++;
    }
  }

  console.log(`🎉 [Post-OCR Correction] Applied ${correctionCount} corrections to extracted data`);
  
  return corrected;
}

/**
 * แก้ไขข้อมูลใน Certificate Base ที่มีอยู่แล้ว
 */
export function correctCertificateBaseData(certificateBase: any): any {
  if (!certificateBase || typeof certificateBase !== 'object') {
    return certificateBase;
  }

  console.log('🔧 [Post-OCR Correction] Correcting certificate base data...');
  
  const corrected = { ...certificateBase };
  let correctionCount = 0;

  // ✅ แก้ไข certificate_name (แยกวันที่ออก)
  if (corrected.certificate_name) {
    const originalCourseName = corrected.certificate_name;
    const datePattern = /\s+On\s+[A-Z][a-z]+\s+\d{1,2},?\s*\d{4}$/;
    if (datePattern.test(originalCourseName)) {
      corrected.certificate_name = originalCourseName.replace(datePattern, '').trim();
      console.log(`✅ [Post-OCR Correction] Corrected course_name: ${originalCourseName} → ${corrected.certificate_name}`);
      correctionCount++;
    }
  }

  // ✅ แก้ไข organize_base_name
  if (corrected.organize_base_name) {
    const originalOrgName = corrected.organize_base_name;
    corrected.organize_base_name = applyCorrections(originalOrgName, ORGANIZATION_CORRECTIONS);
    if (corrected.organize_base_name !== originalOrgName) {
      console.log(`✅ [Post-OCR Correction] Corrected organize_base_name: ${originalOrgName} → ${corrected.organize_base_name}`);
      correctionCount++;
    }
  }

  // ✅ แก้ไข supervisor_name1
  if (corrected.supervisor_name1) {
    const originalSupervisorName = corrected.supervisor_name1;
    corrected.supervisor_name1 = applyCorrections(originalSupervisorName, INSTRUCTOR_CORRECTIONS);
    if (corrected.supervisor_name1 !== originalSupervisorName) {
      console.log(`✅ [Post-OCR Correction] Corrected supervisor_name1: ${originalSupervisorName} → ${corrected.supervisor_name1}`);
      correctionCount++;
    }
  }

  // ✅ แก้ไข ocr_data.natural_text
  if (corrected.ocr_data?.natural_text) {
    const originalNaturalText = corrected.ocr_data.natural_text;
    corrected.ocr_data.natural_text = correctOCRText(originalNaturalText);
    if (corrected.ocr_data.natural_text !== originalNaturalText) {
      console.log(`✅ [Post-OCR Correction] Corrected natural_text (length: ${corrected.ocr_data.natural_text.length})`);
      correctionCount++;
    }
  }

  console.log(`🎉 [Post-OCR Correction] Applied ${correctionCount} corrections to certificate base data`);
  
  return corrected;
}

/**
 * ตรวจสอบความถูกต้องของข้อมูลที่ extract
 */
export function validateExtractedData(extractedData: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!extractedData) {
    errors.push('No extracted data provided');
    return { isValid: false, errors, warnings };
  }

  // ✅ ตรวจสอบ course_name
  if (!extractedData.course_name || extractedData.course_name === '-') {
    warnings.push('Course name not found or empty');
  } else if (extractedData.course_name.includes('ประประยุกต์')) {
    errors.push('Course name contains OCR error: "ประประยุกต์" should be "ประยุกต์"');
  }

  // ✅ ตรวจสอบ instructor_name
  if (!extractedData.instructor_name || extractedData.instructor_name === '-') {
    warnings.push('Instructor name not found or empty');
  } else if (extractedData.instructor_name.includes('ชูอิดา')) {
    errors.push('Instructor name contains OCR error: "ชูอิดา" should be "ยุวธิดา"');
  }

  // ✅ ตรวจสอบ university_name
  if (!extractedData.university_name || extractedData.university_name === '-') {
    warnings.push('University name not found or empty');
  } else if (extractedData.university_name.includes('สำนักงานพัฒนาครู')) {
    errors.push('University name contains OCR error: should be "สำนักคอมพิวเตอร์ มหาวิทยาลัยบูรพา"');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
