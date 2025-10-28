// src/utils/certificate-corrections.config.ts
/**
 * Configuration สำหรับการแก้ไขข้อมูล Certificate
 * ไม่ Hard Code ค่าเฉพาะเจาะจง
 */

export interface CorrectionMapping {
  incorrect: string;
  correct: string;
  description: string;
}

// ✅ การแก้ไขชื่อหน่วยงาน
export const ORGANIZATION_CORRECTIONS: CorrectionMapping[] = [
  {
    incorrect: 'สำนักงานพัฒนาครู มหวงไทยมูลนิธิ',
    correct: 'สำนักคอมพิวเตอร์ มหาวิทยาลัยบูรพา',
    description: 'แก้ไขชื่อมหาวิทยาลัยที่ผิดเพี้ยน'
  },
  {
    incorrect: 'สำนักงานพัฒนาครู',
    correct: 'สำนักคอมพิวเตอร์',
    description: 'แก้ไขชื่อหน่วยงานที่ผิด'
  },
  {
    incorrect: 'มหวงไทยมูลนิธิ',
    correct: 'มหาวิทยาลัยบูรพา',
    description: 'แก้ไขชื่อมหาวิทยาลัยที่ผิด'
  }
];

// ✅ การแก้ไขชื่ออาจารย์
export const INSTRUCTOR_CORRECTIONS: CorrectionMapping[] = [
  {
    incorrect: 'ชูอิดา ยะบินทร',
    correct: 'ยุวธิดา ยะนินทร',
    description: 'แก้ไขชื่ออาจารย์ที่ผิดเพี้ยน'
  },
  {
    incorrect: 'ชูอิดา',
    correct: 'ยุวธิดา',
    description: 'แก้ไขชื่อแรกที่ผิด'
  },
  {
    incorrect: 'ยะบินทร',
    correct: 'ยะนินทร',
    description: 'แก้ไขนามสกุลที่ผิด'
  }
];

// ✅ การแก้ไขตำแหน่ง
export const TITLE_CORRECTIONS: CorrectionMapping[] = [
  {
    incorrect: 'หัวหน้าฝ่ายวิจัยและพัฒนาการเรียนรู้ออนไลน์',
    correct: 'หัวหน้าฝ่ายนวัตกรรมการเรียนการสอน',
    description: 'แก้ไขตำแหน่งที่ผิด'
  }
];

/**
 * ฟังก์ชันแก้ไขข้อความตาม mapping
 */
export function applyCorrections(text: string, corrections: CorrectionMapping[]): string {
  let correctedText = text;
  let correctionCount = 0;

  for (const correction of corrections) {
    if (correctedText.includes(correction.incorrect)) {
      correctedText = correctedText.replace(
        new RegExp(correction.incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        correction.correct
      );
      console.log(`✅ [Correction] Applied: ${correction.incorrect} → ${correction.correct}`);
      correctionCount++;
    }
  }

  if (correctionCount > 0) {
    console.log(`🔧 [Correction] Applied ${correctionCount} corrections to text`);
  }

  return correctedText;
}
