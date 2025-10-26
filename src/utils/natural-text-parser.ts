/**
 * Utility functions for parsing THAI MOOC certificate data
 */

interface ThaiMoocParsedData {
  certificate_type: "THAI MOOC" | "BUU MOOC" | "Other";
  certificate_name?: string;
  organization_name?: string;
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
    
    // Check line 3 (index 2) for "THAI MOOC"
    if (lines.length >= 3) {
      const line3 = lines[2].trim();
      if (line3.includes('THAI MOOC')) {
        return "THAI MOOC";
      }
    }
    
    // Check for BUU MOOC patterns
    if (naturalText.includes('BUU MOOC') || naturalText.includes('Certificate of BUU MOOC')) {
      return "BUU MOOC";
    }
    
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
function parseBuuMoocData(naturalText: string): ThaiMoocParsedData {
  const result: ThaiMoocParsedData = {
    certificate_type: "BUU MOOC"
  };
  
  try {
    const lines = naturalText.split('\n');
    
    // Extract certificate_name (line 7 = index 6)
    if (lines.length >= 7) {
      result.certificate_name = lines[6].trim();
    }
    
    // Extract date "On June 30, 2025"
    const dateMatch = naturalText.match(/On\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/);
    if (dateMatch && dateMatch[1]) {
      try {
        result.get_certificate_date = parseBuuMoocDate(dateMatch[1]);
      } catch (error) {
        console.error("Error parsing BUU MOOC date:", error);
        result.get_certificate_date = null;
      }
    }
    
    // Extract organization_name (line 13 = index 12)
    if (lines.length >= 13) {
      result.organization_name = lines[12].trim();
    }
    
    // Extract supervisor_name1 (line 11 = index 10), remove parentheses
    if (lines.length >= 11) {
      const supervisor = lines[10].trim();
      // Try to extract from parentheses if exists, otherwise use the whole line
      const parenthesesMatch = supervisor.match(/\(([^)]+)\)/);
      if (parenthesesMatch && parenthesesMatch[1]) {
        result.supervisor_name1 = parenthesesMatch[1].trim();
      } else {
        result.supervisor_name1 = supervisor.replace(/\([^)]*\)/g, '').trim();
      }
    }
    
    // Extract student name (line 4 = index 3)
    if (lines.length >= 4) {
      const nameLine = lines[3].trim();
      const nameParts = nameLine.split(' ');
      if (nameParts.length >= 2) {
        result.firstName = nameParts[0];
        result.lastName = nameParts.slice(1).join(' ');
      }
    }
    
    console.log("🔍 [parseBuuMoocData] Parsed fields:", {
      certificate_name: result.certificate_name,
      organization_name: result.organization_name,
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
function parseThaiMoocDataLogic(naturalText: string): ThaiMoocParsedData {
  const result: ThaiMoocParsedData = {
    certificate_type: "THAI MOOC"
  };
  
  try {
    const lines = naturalText.split('\n');
    
    // Rule 2: Extract certificate_name (line 11, which is index 10)
    if (lines.length >= 11) {
      result.certificate_name = lines[10].trim(); // Line 11 (index 10)
    }
    
    // Rule 3: Extract organization_name (between "Awarded by" and "on")
    const awardedByMatch = naturalText.match(/Awarded by\s+(.+?)\s+on/);
    if (awardedByMatch && awardedByMatch[1]) {
      result.organization_name = awardedByMatch[1].trim();
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
    
    // ✅ แยก logic ด้วย if-else if
    if (certificateType === "THAI MOOC") {
      console.log("🔍 [parseThaiMoocData] Detected THAI MOOC, parsing...");
      return parseThaiMoocDataLogic(naturalText);
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
