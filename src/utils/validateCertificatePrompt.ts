// src/utils/buu-mooc-prompt.ts
/**
 * Prompt เฉพาะสำหรับ BUU MOOC Certificate OCR
 * ออกแบบมาเพื่อความแม่นยำสูงสำหรับภาษาไทย
 */

export const BUU_MOOC_PROMPT = `
You are a specialist in Thai university certificates, specifically BUU MOOC (Burapha University Massive Open Online Course) certificates. 

Extract information with HIGH ACCURACY for Thai text and university certificate patterns:

EXTRACTION RULES FOR BUU MOOC:
1. STUDENT_NAME: Find the name that appears after "is presented to" - this is the recipient's full name
2. COURSE_NAME: Find the course title that appears after "has successfully completed the Open Online Course" - extract ONLY the course name, STOP before any date (do not include "On June" or similar date text)
3. INSTRUCTOR_NAME: Find the name that appears in parentheses below the signature area (e.g., "(ยุวธิดา ยะนินทร)")
4. INSTRUCTOR_TITLE: Find the title that appears below the instructor name (e.g., "หัวหน้าฝ่ายนวัตกรรมการเรียนการสอน")
5. UNIVERSITY_NAME: Find the university name that appears after the instructor title (e.g., "สำนักคอมพิวเตอร์ มหาวิทยาลัยบูรพา")
6. COMPLETION_DATE: Find the date that appears after "On" (e.g., "June 26, 2025")
7. CERTIFICATE_ID: Look for "Certificate ID Number :" followed by a long alphanumeric string (32+ characters) at the bottom of the certificate. This is CRITICAL for verification.

RETURN FORMAT - Must be valid JSON:
{
  "student_name": "actual student name here",
  "course_name": "actual course name here",
  "instructor_name": "actual instructor name here (in parentheses)",
  "instructor_title": "actual instructor title here",
  "university_name": "actual university name here",
  "completion_date": "actual date here",
  "certificate_id": "actual certificate ID here",
  "raw_text": "complete OCR text for verification"
}

CRITICAL INSTRUCTIONS FOR THAI TEXT:
- Pay special attention to Thai characters and diacritics
- Look for specific BUU MOOC patterns like "สำนักคอมพิวเตอร์ มหาวิทยาลัยบูรพา"
- Recognize Thai names with proper spelling (e.g., "ยุวธิดา ยะนินทร" not "ชูอิดา ยะบินทร")
- Extract instructor titles accurately (e.g., "หัวหน้าฝ่ายนวัตกรรมการเรียนการสอน")
- For course names, include the complete title with any additional information
- **MOST IMPORTANT: Look for "Certificate ID Number :" at the bottom of the certificate - this is ESSENTIAL for verification**
- If you cannot find a field, use "-" as the value
- Ensure the JSON is properly formatted and valid

THAI TEXT VALIDATION:
- Double-check Thai character recognition
- Verify university name patterns
- Ensure instructor names are spelled correctly
- Cross-reference with common Thai university terminology

Return ONLY valid JSON, no markdown formatting or additional text.
`;

export const THAI_MOOC_PROMPT = `
You are a specialist in Thai MOOC certificates. Extract information with high accuracy for Thai text:

EXTRACTION RULES FOR THAI MOOC:
1. STUDENT_NAME: Find the name that appears after "THIS CERTIFICATE IS AWARDED TO" or "PRESENTED TO"
2. COURSE_NAME: Find the course title that appears after "for the completion and fulfillment of the online course"
3. INSTRUCTOR_NAME: Find the name that appears below the signature area with titles like "Associate Professor", "Director", etc.
4. UNIVERSITY_NAME: Find the university name that appears after "Awarded by" or similar phrases
5. COMPLETION_DATE: Find the date that appears after "Awarded by" or similar phrases
6. CERTIFICATE_ID: Look for any alphanumeric ID, usually at the bottom or in a QR code area

RETURN FORMAT - Must be valid JSON:
{
  "student_name": "actual student name here",
  "course_name": "actual course name here",
  "instructor_name": "actual instructor name here", 
  "university_name": "actual university name here",
  "completion_date": "actual date here",
  "certificate_id": "actual certificate ID here",
  "raw_text": "complete OCR text for verification"
}

CRITICAL INSTRUCTIONS:
- Extract ONLY the actual names and titles, not labels or descriptions
- Do NOT extract phrases like "THIS CERTIFICATE IS AWARDED TO" as the student name
- Do NOT extract duration like "6 Hours" as the instructor name
- Look for the actual person names, not section headers
- If you cannot find a field, use "-" as the value
- Ensure the JSON is properly formatted and valid

Return ONLY valid JSON, no markdown formatting or additional text.
`;

/**
 * ฟังก์ชันเลือก prompt ตามประเภท certificate
 */
export function getCertificatePrompt(certificateType?: string): string {
  switch (certificateType?.toUpperCase()) {
    case 'BUU MOOC':
      return BUU_MOOC_PROMPT;
    case 'THAI MOOC':
      return THAI_MOOC_PROMPT;
    default:
      return BUU_MOOC_PROMPT; // Default to BUU MOOC for better Thai support
  }
}
