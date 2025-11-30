/**
 * Utility functions for parsing THAI MOOC certificate data
 */

interface ThaiMoocParsedData {
  certificate_type: "THAI MOOC" | "BUU MOOC" | "Other";
  certificate_name?: string;
  organize_base_name?: string;
  get_certificate_date?: Date | null;
  supervisor_name1?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Extract text between two newline positions
 */
function extractBetweenNewlines(text: string, startPos: number, endPos: number): string {
  const lines = text.split('\n');
  if (startPos <= 0 || endPos <= 0 || startPos > lines.length || endPos > lines.length) {
    return '';
  }
  return lines[endPos - 1] || '';
}

/**
 * Determine certificate type from natural_text
 */
export function detectCertificateType(naturalText: string): "THAI MOOC" | "BUU MOOC" | "Other" {
  try {
    const lines = naturalText.split('\n');
    
    // ✅ Check for THAI MOOC patterns (ตรวจสอบหลายบรรทัด)
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim();
      if (line.includes('THAI MOOC') || 
          line.includes('Thailand Massive Open Online Course') ||
          line.includes('CERTIFICATE OF COMPLETION')) {
        console.log(`🔍 [detectCertificateType] Found THAI MOOC at line ${i + 1}: "${line}"`);
        return "THAI MOOC";
      }
    }
    
    // ✅ Check for BUU MOOC patterns
    if (naturalText.includes('BUU MOOC') || 
        naturalText.includes('Certificate of BUU MOOC') ||
        naturalText.includes('CERTIFICATE OF BUU MOOC')) {
      console.log('🔍 [detectCertificateType] Found BUU MOOC');
      return "BUU MOOC";
    }
    
    console.log('⚠️ [detectCertificateType] No matching pattern, returning Other');
    return "Other";
  } catch (error) {
    console.error("Error detecting certificate type:", error);
    return "Other";
  }
}

/**
 * Parse date string for BUU MOOC format (e.g., "June 30, 2025") to Date object
 */
function parseBuuMoocDate(dateString: string): Date | null {
  try {
    // Handle BUU MOOC date format: "June 30, 2025"
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    return dateObj;
  } catch (error) {
    console.error("Error parsing BUU MOOC date:", error);
    return null;
  }
}

/**
 * Parse BUU MOOC certificate data from natural_text
 */
export function parseBuuMoocData(naturalText: string): ThaiMoocParsedData {
  const result: ThaiMoocParsedData = {
    certificate_type: "BUU MOOC"
  };
  
  try {
    const lines = naturalText.split('\n');
    
    // ✅ ตรวจสอบว่าเป็น PDF format หรือไม่ (PDF มีบรรทัดว่างมาก)
    // ✅ นับจำนวนบรรทัดว่างใน 10 บรรทัดแรก
    const emptyLineCount = lines.slice(0, Math.min(10, lines.length))
                                .filter(line => line.trim() === '')
                                .length;
    
    // ✅ ถ้ามีบรรทัดว่าง >= 4 บรรทัด ในช่วง 10 บรรทัดแรก = PDF format
    const isPdfFormat = emptyLineCount >= 4;
    
    console.log(`🔍 [parseBuuMoocData] Format detection: emptyLines=${emptyLineCount}, isPdfFormat=${isPdfFormat}`);
    
    // ✅ Extract certificate_name
    if (isPdfFormat) {
      // ✅ สำหรับ PDF: ใช้ข้อความระหว่าง \n ตัวที่ 8 ถึง \n ตัวที่ 9
      const newlinePositions: number[] = [];
      for (let i = 0; i < naturalText.length; i++) {
        if (naturalText[i] === '\n') {
          newlinePositions.push(i);
        }
      }
      
      // ✅ เช็คว่ามี \n อย่างน้อย 9 ตัว
      if (newlinePositions.length >= 9) {
        const start = newlinePositions[7] + 1; // หลัง \n ตัวที่ 8 (index 7)
        const end = newlinePositions[8];        // ก่อน \n ตัวที่ 9 (index 8)
        const courseName = naturalText.substring(start, end).trim();
        
        if (courseName) {
          result.certificate_name = courseName;
          console.log("📄 [parseBuuMoocData] PDF format: extracted course name between \\n #8 and \\n #9:", courseName);
        }
      } else {
        console.warn("⚠️ [parseBuuMoocData] PDF format: not enough newlines found", newlinePositions.length);
      }
    } else {
      // ✅ สำหรับ Image: ใช้ line 7 (index 6)
      if (lines.length >= 7) {
        const courseName = lines[6].trim(); // index 6 = line 7
        if (courseName) {
          result.certificate_name = courseName;
          console.log("🖼️ [parseBuuMoocData] Image format detected, using line 7 (index 6) for course name:", courseName);
        }
      }
    }
    
    // ✅ Fallback: ถ้ายังไม่ได้ชื่อกิจกรรม ให้ลองหาจาก pattern หรือบรรทัดที่เหมาะสม
    if (!result.certificate_name) {
      // ✅ ลองหาชื่อกิจกรรมที่บรรทัดที่มีข้อความยาว (มักจะเป็นชื่อหลักสูตร)
      for (let i = 6; i < Math.min(lines.length, 10); i++) {
        const line = lines[i].trim();
        if (line && line.length > 10 && 
            !line.includes('has successfully') && 
            !line.includes('On ') && 
            !line.match(/^\(.+\)$/)) {
          result.certificate_name = line;
          console.log("🔍 [parseBuuMoocData] Fallback: Found course name at line", i + 1, ":", line);
          break;
        }
      }
    }
    
    // Extract date "On June 30, 2025" (ใช้ regex เพื่อความแม่นยำ)
    const dateMatch = naturalText.match(/On\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/);
    if (dateMatch && dateMatch[1]) {
      try {
        result.get_certificate_date = parseBuuMoocDate(dateMatch[1]);
      } catch (error) {
        console.error("Error parsing BUU MOOC date:", error);
        result.get_certificate_date = null;
      }
    }
    
    // ✅ สำหรับ PDF format: แก้ไข index ให้ถูกต้อง
    if (isPdfFormat) {
      // ✅ Extract organize_base_name (line 15 = index 14)
      if (lines.length >= 15) {
        result.organize_base_name = lines[14].trim();
        console.log("📄 [parseBuuMoocData] PDF format: organize_base_name from line 15 (index 14):", result.organize_base_name);
      }
      
      // ✅ Extract supervisor_name1 (line 13 = index 12), remove parentheses
      if (lines.length >= 13) {
        const supervisor = lines[12].trim();
        // Try to extract from parentheses if exists, otherwise use the whole line
        const parenthesesMatch = supervisor.match(/\(([^)]+)\)/);
        if (parenthesesMatch && parenthesesMatch[1]) {
          result.supervisor_name1 = parenthesesMatch[1].trim();
          console.log("📄 [parseBuuMoocData] PDF format: supervisor_name1 from line 13 (index 12):", result.supervisor_name1);
        } else {
          result.supervisor_name1 = supervisor.replace(/\([^)]*\)/g, '').trim();
        }
      }
      
      // ✅ Extract student name (line 5 = index 4)
      if (lines.length >= 5) {
        const nameLine = lines[4].trim();
        const nameParts = nameLine.split(' ');
        if (nameParts.length >= 2) {
          result.firstName = nameParts[0];
          result.lastName = nameParts.slice(1).join(' ');
          console.log("📄 [parseBuuMoocData] PDF format: student name from line 5 (index 4):", `${result.firstName} ${result.lastName}`);
        }
      }
    } else {
      // ✅ สำหรับ Image format: ใช้ index เดิม
      // ✅ Extract organize_base_name (line 13 = index 12)
      if (lines.length >= 13) {
        result.organize_base_name = lines[12].trim();
        console.log("🖼️ [parseBuuMoocData] Image format: organize_base_name from line 13 (index 12):", result.organize_base_name);
      }
      
      // ✅ Extract supervisor_name1 (line 11 = index 10), remove parentheses
      if (lines.length >= 11) {
        const supervisor = lines[10].trim();
        // Try to extract from parentheses if exists, otherwise use the whole line
        const parenthesesMatch = supervisor.match(/\(([^)]+)\)/);
        if (parenthesesMatch && parenthesesMatch[1]) {
          result.supervisor_name1 = parenthesesMatch[1].trim();
          console.log("🖼️ [parseBuuMoocData] Image format: supervisor_name1 from line 11 (index 10):", result.supervisor_name1);
        } else {
          result.supervisor_name1 = supervisor.replace(/\([^)]*\)/g, '').trim();
        }
      }
      
      // ✅ Extract student name (line 4 = index 3)
      if (lines.length >= 4) {
        const nameLine = lines[3].trim();
        const nameParts = nameLine.split(' ');
        if (nameParts.length >= 2) {
          result.firstName = nameParts[0];
          result.lastName = nameParts.slice(1).join(' ');
          console.log("🖼️ [parseBuuMoocData] Image format: student name from line 4 (index 3):", `${result.firstName} ${result.lastName}`);
        }
      }
    }
    
    console.log("🔍 [parseBuuMoocData] Parsed fields:", {
      certificate_name: result.certificate_name,
      organize_base_name: result.organize_base_name,
      get_certificate_date: result.get_certificate_date,
      supervisor_name1: result.supervisor_name1
    });
    
  } catch (error) {
    console.error("Error parsing BUU MOOC data:", error);
  }
  
  return result;
}

/**
 * Parse THAI MOOC certificate data from natural_text
 */
function parseThaiMoocDataLogic(naturalText: string, isPdfFormat: boolean = false): ThaiMoocParsedData {
  const result: ThaiMoocParsedData = {
    certificate_type: "THAI MOOC"
  };
  
  try {
    const lines = naturalText.split('\n');
    
    if (isPdfFormat) {
      // ✅ สำหรับ PDF format (อาจเป็น Markdown format จาก OCR)
      console.log("📄 [parseThaiMoocDataLogic] Parsing THAI MOOC PDF format");
      
      // ✅ ตรวจสอบว่าเป็น Markdown format หรือไม่ (มี #, **, ---)
      const isMarkdownFormat = naturalText.includes('#') || naturalText.includes('**') || naturalText.includes('---');
      
      if (isMarkdownFormat) {
        console.log("📄 [parseThaiMoocDataLogic] Detected Markdown format in PDF");
        
        // ✅ Extract certificate_name (จาก **...** หรือบรรทัดที่มี course name)
        // ตัวอย่าง: "**Basic Internet of Things (loTs) (8 Hours)**"
        const courseNameMatch = naturalText.match(/\*\*([^*]+?)\*\*/);
        if (courseNameMatch && courseNameMatch[1]) {
          // ✅ ลบ (8 Hours) หรือเวลาอื่นๆ ออก
          let courseName = courseNameMatch[1].trim();
          courseName = courseName.replace(/\s*\([^)]*Hours?[^)]*\)\s*/i, '').trim();
          result.certificate_name = courseName;
          console.log("📄 [parseThaiMoocDataLogic] PDF (Markdown): certificate_name from **:", result.certificate_name);
        } else {
          // ✅ Fallback: หาจากบรรทัดที่มี "for the completion"
          const completionMatch = naturalText.match(/for the completion[^\n]*\n+([^\n*]+)/i);
          if (completionMatch && completionMatch[1]) {
            let courseName = completionMatch[1].trim();
            courseName = courseName.replace(/\s*\([^)]*Hours?[^)]*\)\s*/i, '').trim();
            result.certificate_name = courseName;
            console.log("📄 [parseThaiMoocDataLogic] PDF (Markdown): certificate_name from completion line:", result.certificate_name);
          }
        }
        
        // ✅ Extract organize_base_name (จาก "Awarded by ... on")
        const awardedByMatch = naturalText.match(/Awarded by\s+(.+?)\s+on/i);
        if (awardedByMatch && awardedByMatch[1]) {
          result.organize_base_name = awardedByMatch[1].trim();
          console.log("📄 [parseThaiMoocDataLogic] PDF (Markdown): organize_base_name:", result.organize_base_name);
        }
        
        // ✅ Extract get_certificate_date (จาก "on [date]")
        const dateMatch = naturalText.match(/on\s+(\d{1,2}\s+[A-Z][a-z]+\s+\d{4})/i);
        if (dateMatch && dateMatch[1]) {
          try {
            result.get_certificate_date = parseDate(dateMatch[1].trim());
            console.log("📄 [parseThaiMoocDataLogic] PDF (Markdown): date:", result.get_certificate_date);
          } catch (error) {
            console.error("Error parsing date:", error);
            result.get_certificate_date = null;
          }
        }
        
        // ✅ Extract supervisor_name1 (บรรทัดสุดท้าย หรือหลัง ---)
        // ตัวอย่าง: "Associate Professor Thapanee Thammatar, Ph.D."
        const afterSeparator = naturalText.split('---');
        if (afterSeparator.length > 1) {
          const supervisorLines = afterSeparator[afterSeparator.length - 1].split('\n').filter(l => l.trim());
          if (supervisorLines.length > 0) {
            result.supervisor_name1 = supervisorLines[0].trim();
            console.log("📄 [parseThaiMoocDataLogic] PDF (Markdown): supervisor_name1 after ---:", result.supervisor_name1);
          }
        } else {
          // ✅ Fallback: หาบรรทัดสุดท้ายที่ไม่ใช่ empty
          const nonEmptyLines = lines.filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('*'));
          if (nonEmptyLines.length > 0) {
            result.supervisor_name1 = nonEmptyLines[nonEmptyLines.length - 1].trim();
            console.log("📄 [parseThaiMoocDataLogic] PDF (Markdown): supervisor_name1 from last line:", result.supervisor_name1);
          }
        }
        
        // ✅ Extract student name (จาก #### หรือบรรทัดหลัง "THIS CERTIFICATE IS AWARDED TO")
        const nameMatch = naturalText.match(/####\s+([^\n]+)/) || naturalText.match(/THIS CERTIFICATE IS AWARDED TO[^\n]*\n+[^\n]*\n+([^\n]+)/i);
        if (nameMatch && nameMatch[1]) {
          const nameLine = nameMatch[1].trim();
          const nameParts = nameLine.split(' ');
          if (nameParts.length >= 2) {
            result.firstName = nameParts[0].trim();
            result.lastName = nameParts.slice(1).join(' ').trim();
            console.log("📄 [parseThaiMoocDataLogic] PDF (Markdown): student name:", `${result.firstName} ${result.lastName}`);
          }
        }
      } else {
        // ✅ สำหรับ PDF format แบบเดิม (non-Markdown)
        console.log("📄 [parseThaiMoocDataLogic] Parsing PDF format (non-Markdown)");
        
        // ✅ Extract certificate_name (line 11 = index 10)
        if (lines.length >= 11) {
          result.certificate_name = lines[10].trim();
          console.log("📄 [parseThaiMoocDataLogic] PDF: certificate_name from line 11:", result.certificate_name);
        }
        
        // ✅ Extract organize_base_name (จาก "โดย มหาวิทยาลัย..." ใน line 13)
        if (lines.length >= 13) {
          const line = lines[12].trim();
          // สกัดชื่อมหาวิทยาลัยจากรูปแบบ "โดย [ชื่อมหาวิทยาลัย] ให้ไว้ ณ วันที่..."
          const orgMatch = line.match(/โดย\s+(.+?)\s+ให้ไว้/);
          if (orgMatch && orgMatch[1]) {
            result.organize_base_name = orgMatch[1].trim();
            console.log("📄 [parseThaiMoocDataLogic] PDF: organize_base_name from line 13:", result.organize_base_name);
          }
        }
        
        // ✅ Extract get_certificate_date (จาก "ให้ไว้ ณ วันที่ ...")
        if (lines.length >= 13) {
          const line = lines[12].trim();
          const dateMatch = line.match(/ณ วันที่\s+(.+?)$/);
          if (dateMatch && dateMatch[1]) {
            try {
              result.get_certificate_date = parseThaiDate(dateMatch[1].trim());
              console.log("📄 [parseThaiMoocDataLogic] PDF: date from line 13:", result.get_certificate_date);
            } catch (error) {
              console.error("Error parsing Thai date:", error);
              result.get_certificate_date = null;
            }
          }
        }
        
        // ✅ Extract supervisor_name1 (line 15 = index 14)
        if (lines.length >= 15) {
          result.supervisor_name1 = lines[14].trim();
          console.log("📄 [parseThaiMoocDataLogic] PDF: supervisor_name1 from line 15:", result.supervisor_name1);
        }
        
        // ✅ Extract student name (line 7 = index 6)
        if (lines.length >= 7) {
          const nameLine = lines[6].trim();
          const nameParts = nameLine.split(' ');
          if (nameParts.length >= 2) {
            result.firstName = nameParts[0].trim();
            result.lastName = nameParts.slice(1).join(' ').trim();
            console.log("📄 [parseThaiMoocDataLogic] PDF: student name from line 7:", `${result.firstName} ${result.lastName}`);
          }
        }
      }
      
    } else {
      // ✅ สำหรับ Image format (เดิม)
      console.log("🖼️ [parseThaiMoocDataLogic] Parsing THAI MOOC Image format");
      
      // Rule 2: Extract certificate_name (line 11, which is index 10)
      if (lines.length >= 11) {
        let courseName = lines[10].trim(); // Line 11 (index 10)
        
        // ✅ แก้ไข: แยกวันที่ออกจากชื่อหลักสูตรสำหรับ BUU MOOC
        // ตรวจสอบว่ามีรูปแบบ "On June" หรือ "On [Month]" อยู่ท้ายชื่อหลักสูตรหรือไม่
        const datePattern = /\s+On\s+[A-Z][a-z]+\s+\d{1,2},?\s*\d{4}$/;
        if (datePattern.test(courseName)) {
          courseName = courseName.replace(datePattern, '').trim();
          console.log("🔧 [NaturalTextParser] Removed date from course name:", courseName);
        }
        
        result.certificate_name = courseName;
      }
      
      // Rule 3: Extract organize_base_name (between "Awarded by" and "on")
      const awardedByMatch = naturalText.match(/Awarded by\s+(.+?)\s+on/);
      if (awardedByMatch && awardedByMatch[1]) {
        result.organize_base_name = awardedByMatch[1].trim();
      }
      
      // Rule 4: Extract get_certificate_date (after "on")
      const onMatch = naturalText.match(/on\s+(\d{1,2}\s+[A-Z][a-z]+\s+\d{4})/);
      if (onMatch && onMatch[1]) {
        try {
          result.get_certificate_date = parseDate(onMatch[1]);
        } catch (error) {
          console.error("Error parsing date:", error);
          result.get_certificate_date = null;
        }
      }
      
      // Rule 5: Extract supervisor_name1 (line 17, which is index 16)
      if (lines.length >= 17) {
        result.supervisor_name1 = lines[16].trim(); // Line 17 (index 16)
      }
      
      // Extract name for verification (line 7, which is index 6)
      // First line after "THIS CERTIFICATE IS AWARDED TO"
      if (lines.length >= 7) {
        const nameLine = lines[6].trim(); // Line 7 (index 6)
        const nameParts = nameLine.split(' ');
        if (nameParts.length >= 2) {
          result.firstName = nameParts[0].trim();
          result.lastName = nameParts.slice(1).join(' ').trim();
        }
      }
    }
    
  } catch (error) {
    console.error("Error parsing THAI MOOC data:", error);
  }
  
  return result;
}

/**
 * Main parse function - routes to appropriate parser based on certificate type
 */
export function parseThaiMoocData(naturalText: string): ThaiMoocParsedData {
  const result: ThaiMoocParsedData = {
    certificate_type: "Other"
  };
  
  try {
    // Detect certificate type
    const certificateType = detectCertificateType(naturalText);
    
    // ✅ ตรวจจับ PDF format หรือ Markdown format
    const lines = naturalText.split('\n');
    const emptyLineCount = lines.slice(0, Math.min(10, lines.length))
                                .filter(line => line.trim() === '')
                                .length;
    // ✅ ตรวจสอบว่าเป็น Markdown format (มี #, **, ---)
    const isMarkdownFormat = naturalText.includes('#') || naturalText.includes('**') || naturalText.includes('---');
    // ✅ ถ้าเป็น Markdown format หรือมี empty lines >= 4 ถือว่าเป็น PDF format
    const isPdfFormat = isMarkdownFormat || emptyLineCount >= 4;
    
    console.log(`🔍 [parseThaiMoocData] Certificate type: ${certificateType}, Format: ${isPdfFormat ? 'PDF' : 'Image'}, Empty lines: ${emptyLineCount}, Markdown: ${isMarkdownFormat}`);
    
    // ✅ แยก logic ด้วย if-else if
    if (certificateType === "THAI MOOC") {
      console.log("🔍 [parseThaiMoocData] Detected THAI MOOC, parsing...");
      return parseThaiMoocDataLogic(naturalText, isPdfFormat);
    } else if (certificateType === "BUU MOOC") {
      console.log("🔍 [parseThaiMoocData] Detected BUU MOOC, parsing...");
      return parseBuuMoocData(naturalText);
    }
    
    console.log("⚠️ [parseThaiMoocData] Unknown certificate type:", certificateType);
    return result;
    
  } catch (error) {
    console.error("Error parsing certificate data:", error);
    return result;
  }
}

/**
 * Parse date string (e.g., "24 June 2025") to Date object
 */
function parseDate(dateString: string): Date | null {
  try {
    // Handle Thai date format: "24 June 2025"
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    return dateObj;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
}

/**
 * Parse Thai date string (e.g., "16 พฤษภาคม 2568") to Date object
 */
function parseThaiDate(dateString: string): Date | null {
  try {
    // Map Thai month names to numbers
    const thaiMonths: { [key: string]: number } = {
      'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3,
      'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7,
      'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
    };
    
    // Parse format: "16 พฤษภาคม 2568"
    const parts = dateString.trim().split(/\s+/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0]);
      const thaiMonth = parts[1];
      const buddhistYear = parseInt(parts[2]);
      
      // Convert Buddhist year to Gregorian year
      const gregorianYear = buddhistYear - 543;
      
      // Get month number
      const month = thaiMonths[thaiMonth];
      
      if (month !== undefined && !isNaN(day) && !isNaN(gregorianYear)) {
        const date = new Date(gregorianYear, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing Thai date:", error);
    return null;
  }
}

/**
 * Compare natural texts character by character
 */
export function compareNaturalTexts(templateText: string, studentText: string): {
  totalChars: number;
  matchingChars: number;
  nonMatchingChars: number;
  similarityPercentage: number;
} {
  const totalChars = Math.max(templateText.length, studentText.length);
  let matchingChars = 0;
  let nonMatchingChars = 0;
  
  const minLength = Math.min(templateText.length, studentText.length);
  
  for (let i = 0; i < minLength; i++) {
    if (templateText[i] === studentText[i]) {
      matchingChars++;
    } else {
      nonMatchingChars++;
    }
  }
  
  // Count extra chars as non-matching
  nonMatchingChars += Math.abs(templateText.length - studentText.length);
  
  const similarityPercentage = totalChars > 0 ? (matchingChars / totalChars) * 100 : 0;
  
  return {
    totalChars,
    matchingChars,
    nonMatchingChars,
    similarityPercentage
  };
}

/**
 * Verify student name against certificate name
 */
export function verifyThaiMoocName(
  certificateFirstName: string,
  certificateLastName: string,
  studentFirstNameEng: string | null,
  studentFirstNameTha: string | null,
  studentLastNameEng: string | null,
  studentLastNameTha: string | null
): {
  firstNameValid: boolean;
  lastNameValid: boolean;
  firstNameMatchType?: string;
  lastNameMatchType?: string;
} {
  // Verify first name
  let firstNameValid = false;
  let firstNameMatchType: string | undefined;
  
  if (studentFirstNameEng && certificateFirstName.toUpperCase() === studentFirstNameEng.toUpperCase()) {
    firstNameValid = true;
    firstNameMatchType = "first_name_eng";
  } else if (studentFirstNameTha && certificateFirstName === studentFirstNameTha) {
    firstNameValid = true;
    firstNameMatchType = "first_name_tha";
  }
  
  // Verify last name
  let lastNameValid = false;
  let lastNameMatchType: string | undefined;
  
  if (studentLastNameEng && certificateLastName.toUpperCase() === studentLastNameEng.toUpperCase()) {
    lastNameValid = true;
    lastNameMatchType = "last_name_eng";
  } else if (studentLastNameTha && certificateLastName === studentLastNameTha) {
    lastNameValid = true;
    lastNameMatchType = "last_name_tha";
  }
  
  return {
    firstNameValid,
    lastNameValid,
    firstNameMatchType,
    lastNameMatchType
  };
}
