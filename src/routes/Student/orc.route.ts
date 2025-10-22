import { Router, Request, Response } from "express";
import multer from "multer";
import { callTyphoonOCR } from "../../services/Student/ocr.service";

// ✅ Process OCR result function
function processOcrResult(rawData: any) {
  console.log("🔄 [OCR Route] Processing OCR result...");
  
  try {
    // ✅ Extract raw content from Typhoon API response
    let rawContent = "";
    if (rawData.results?.[0]?.message?.choices?.[0]?.message?.content) {
      rawContent = rawData.results[0].message.choices[0].message.content;
    }

    // ✅ ตรวจสอบว่าเป็น structured JSON response หรือไม่
    if (rawContent.trim().startsWith("{")) {
      try {
        const structuredData = JSON.parse(rawContent);
        console.log("✅ [OCR Route] Received structured JSON response:", structuredData);
        
        // ✅ ถ้าได้ structured data แล้ว ให้ใช้ข้อมูลนั้นโดยตรง
        if (structuredData.student_name || structuredData.instructor_name || structuredData.course_name) {
          console.log("✅ [OCR Route] Using structured data from OCR");
          return {
            fullName: structuredData.student_name || "-",
            courseName: structuredData.course_name || "-",
            teacher: structuredData.instructor_name || "-",
            date: structuredData.completion_date || "-",
            certificateId: structuredData.certificate_id || "-",
            rawText: structuredData.raw_text || rawContent
          };
        }
        
        // ✅ ถ้าเป็น JSON แต่ไม่ใช่ structured format ให้ใช้ natural_text
        rawContent = structuredData.natural_text || rawContent;
      } catch (e) {
        console.log("⚠️ [OCR Route] Failed to parse JSON content");
      }
    }

    console.log("📝 [OCR Route] Raw content:", rawContent);

    // ✅ Simple text processing
    const lines = rawContent
      .split(/\n/)
      .map((l: string) => l.trim())
      .filter(Boolean);

    // ✅ Extract information using simple patterns
    let fullName = "-";
    let courseName = "-";
    let teacher = "-";
    let date = "-";
    let certificateId = "-";

    // ✅ Find full name - ปรับปรุงสำหรับใบรับรอง THAI MOOC
    const namePatterns = [
      // รูปแบบเฉพาะสำหรับใบรับรอง
      /THIS CERTIFICATE IS AWARDED TO\s*([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /PRESENTED TO\s*([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /AWARDED TO\s*([A-Z][a-z]+ [A-Z][a-z]+)/i,
      
      // รูปแบบทั่วไป
      /ชื่อ[:\s]*(.+)/i,
      /Name[:\s]*(.+)/i,
      /Presented to[:\s]*(.+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = rawContent.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // ตรวจสอบว่าไม่ใช่ header text
        if (!candidate.includes('CERTIFICATE') && 
            !candidate.includes('AWARDED') && 
            !candidate.includes('COMPLETION') &&
            candidate.length > 3) {
          fullName = candidate;
          console.log(`✅ [OCR Route] Found student name: "${fullName}"`);
          break;
        }
      }
    }

    // ✅ Find course name - ปรับปรุงสำหรับใบรับรอง THAI MOOC
    const coursePatterns = [
      // รูปแบบเฉพาะสำหรับใบรับรอง THAI MOOC
      /for the completion and fulfillment of the online course\s*([^(]+)/i,
      /completion and fulfillment of the online course\s*([^(]+)/i,
      /online course\s*([^(]+)/i,
      
      // รูปแบบทั่วไป
      /หลักสูตร[:\s]*(.+)/i,
      /Course[:\s]*(.+)/i,
      /วิชา[:\s]*(.+)/i,
      
      // รูปแบบเดิม
      /has successfully completed the (.+)/i,
      /การสื่อสารภาษาอังกฤษพื้นฐานเพื่อการทำงาน/i,
      /\(Basic Communicative English for Work\)/i,
      /Open Online Course/i,
      /Basic Communicative English for Work/i,
    ];
    
    for (const pattern of coursePatterns) {
      const match = rawContent.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // ตรวจสอบว่าไม่ใช่ header text
        if (!candidate.includes('THIS CERTIFICATE') && 
            !candidate.includes('AWARDED') && 
            !candidate.includes('COMPLETION') &&
            candidate.length > 3) {
          courseName = candidate;
          console.log(`✅ [OCR Route] Found course name: "${courseName}"`);
          break;
        }
      } else if (pattern.test(rawContent)) {
        // สำหรับ pattern ที่ไม่มี capture group
        courseName = "การสื่อสารภาษาอังกฤษพื้นฐานเพื่อการทำงาน (Basic Communicative English for Work)";
        console.log(`✅ [OCR Route] Found course name (no capture): "${courseName}"`);
        break;
      }
    }

    // ✅ Find teacher - ปรับปรุงสำหรับใบรับรอง THAI MOOC
    const teacherPatterns = [
      // รูปแบบเฉพาะสำหรับใบรับรอง THAI MOOC
      /Associate Professor\s+([A-Z][a-z]+ [A-Z][a-z]+)/i,  // Associate Professor Thapanee Thammetar
      /Director of ([^,]+)/i,  // Director of Thailand Cyber University Project
      /([A-Z][a-z]+ [A-Z][a-z]+),\s*Ph\.D\./i,  // Thapanee Thammetar, Ph.D.
      
      // รูปแบบทั่วไป
      /อาจารย์[:\s]*(.+)/i,
      /Teacher[:\s]*(.+)/i,
      /Instructor[:\s]*(.+)/i,
      
      // รูปแบบเดิม
      /\(([^)]+)\)/i,  // (Miss Weraphon Carmesak)
      /Miss ([A-Z][a-z]+ [A-Z][a-z]+)/i,  // Miss Weraphon Carmesak
      /Mr\. ([A-Z][a-z]+ [A-Z][a-z]+)/i,  // Mr. Weraphon Carmesak
      /Mrs\. ([A-Z][a-z]+ [A-Z][a-z]+)/i,  // Mrs. Weraphon Carmesak
      /Department Head/i,  // ตำแหน่ง
      /Department of (.+)/i,  // Department of Western Languages
    ];
    
    // ✅ หาชื่ออาจารย์ในบริเวณที่ถูกต้อง - เน้นที่บริเวณลายเซ็น
    for (const pattern of teacherPatterns) {
      const match = rawContent.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // กรองข้อมูลที่ไม่เกี่ยวข้อง - เพิ่มการตรวจสอบที่เข้มงวดขึ้น
        if (!candidate.includes('Certificate') && 
            !candidate.includes('University') && 
            !candidate.includes('Basic') &&
            !candidate.includes('Communicative') &&
            !candidate.includes('English') &&
            !candidate.includes('Work') &&
            !candidate.includes('Course') &&
            !candidate.includes('Open') &&
            !candidate.includes('Online') &&
            !candidate.includes('Department') &&
            !candidate.includes('Head') &&
            !candidate.includes('Western') &&
            !candidate.includes('Languages') &&
            !candidate.includes('Hours') &&  // เพิ่มการกรอง "Hours"
            !candidate.includes('6') &&       // เพิ่มการกรองตัวเลข
            candidate.length > 2 && 
            candidate.length < 50) {  // จำกัดความยาว
          teacher = candidate;
          console.log(`✅ [OCR Route] Found instructor name: "${teacher}"`);
          break;
        }
      }
    }
    
    // ✅ ถ้ายังไม่เจอชื่ออาจารย์ ให้ลองหาในบริเวณลายเซ็นโดยตรง
    if (teacher === "-") {
      // หาในบริเวณที่มีคำว่า "Department" หรือ "Head"
      const departmentSection = rawContent.match(/Department[^]*?([A-Z][a-z]+ [A-Z][a-z]+)/i);
      if (departmentSection && departmentSection[1]) {
        const candidate = departmentSection[1].trim();
        if (!candidate.includes('Basic') && 
            !candidate.includes('Communicative') && 
            !candidate.includes('English') &&
            !candidate.includes('Work') &&
            candidate.length > 2) {
          teacher = candidate;
        }
      }
    }

    // ✅ Find date - ปรับปรุงให้ครอบคลุมรูปแบบมากขึ้น
    const datePatterns = [
      // รูปแบบเดิม
      /วันที่[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /Date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      
      // รูปแบบใหม่สำหรับใบรับรอง
      /On (\w+ \d{1,2}, \d{4})/i,  // On June 26, 2025
      /(\d{1,2} \w+ \d{4})/i,  // 26 June 2025
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/i,  // 26/6/68
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/i,  // 26/6/68
      /June \d{1,2}, \d{4}/i,  // June 26, 2025
      /(\w+ \d{1,2}, \d{4})/i,  // June 26, 2025
    ];
    
    for (const pattern of datePatterns) {
      const match = rawContent.match(pattern);
      if (match && match[1]) {
        date = match[1].trim();
        break;
      }
    }

    // ✅ Find certificate ID - ปรับปรุงให้ครอบคลุมรูปแบบมากขึ้น
    const idPatterns = [
      // รูปแบบเดิม
      /Certificate ID[:\s]*([A-Za-z0-9]+)/i,
      /ID[:\s]*([A-Za-z0-9]+)/i,
      /([A-Za-z0-9]{8,})/,
      
      // รูปแบบใหม่สำหรับใบรับรอง
      /Certificate ID Number[:\s]*([A-Za-z0-9]+)/i,  // Certificate ID Number: 366a6a29c39a4b1cac97806fe902868a
      /([a-f0-9]{32})/i,  // 32-character hex string
      /([A-Za-z0-9]{20,})/i,  // Long alphanumeric strings
    ];
    
    for (const pattern of idPatterns) {
      const match = rawContent.match(pattern);
      if (match && match[1]) {
        certificateId = match[1].trim();
        // กรองข้อมูลที่ไม่เกี่ยวข้อง
        if (certificateId.length >= 8 && !certificateId.includes('Certificate') && !certificateId.includes('University')) {
          break;
        }
      }
    }

    const result = {
      fullName,
      courseName,
      teacher,
      date,
      certificateId,
      rawText: rawContent
    };

    console.log("✅ [OCR Route] Processed result:", result);
    return result;

  } catch (error) {
    console.error("❌ [OCR Route] Error processing OCR result:", error);
    return {
      fullName: "-",
      courseName: "-",
      teacher: "-",
      date: "-",
      certificateId: "-",
      rawText: rawData.toString()
    };
  }
}

// จำกัด 20MB
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

// POST /api/ocr
router.post(
  "/",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    console.log("🔍 [OCR Route] Request received");
    console.log("📁 [OCR Route] Files:", req.files);
    console.log("📄 [OCR Route] File:", req.file);
    console.log("📝 [OCR Route] Body:", req.body);
    console.log("🌍 [OCR Route] Headers:", req.headers);
    
    try {
      if (!req.file) {
        console.log("❌ [OCR Route] No file uploaded");
        res.status(400).json({ error: "No file uploaded (field 'file')." });
        return;
      }

      console.log("✅ [OCR Route] File received:", {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      console.log("🚀 [OCR Route] Calling Typhoon OCR...");
      
      // ✅ สร้าง structured prompt ที่เฉพาะเจาะจงสำหรับใบรับรอง THAI MOOC
      const certificatePrompt = `
        You are an expert at extracting information from university certificates. Analyze this certificate image and extract ONLY the following information:

        EXTRACTION RULES:
        1. STUDENT_NAME: Find the name that appears after "THIS CERTIFICATE IS AWARDED TO" or "PRESENTED TO" - this is the recipient's full name
        2. COURSE_NAME: Find the course title that appears after "for the completion and fulfillment of the online course" - this is the actual course name
        3. INSTRUCTOR_NAME: Find the name that appears below the signature area, usually with titles like "Associate Professor", "Director", etc.
        4. COMPLETION_DATE: Find the date that appears after "Awarded by" or similar phrases
        5. CERTIFICATE_ID: Look for any alphanumeric ID, usually at the bottom or in a QR code area

        RETURN FORMAT - Must be valid JSON:
        {
          "student_name": "actual student name here",
          "course_name": "actual course name here",
          "instructor_name": "actual instructor name here", 
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
      `;
      
      const rawData = await callTyphoonOCR(
        {
          buffer: req.file.buffer,
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
        },
        { 
          model: "typhoon-ocr-preview",
          prompt: certificatePrompt
        }
      );

      console.log("🔍 [OCR Route] Raw OCR data:", JSON.stringify(rawData, null, 2));

      // ✅ Process OCR result ให้เป็น structured data
      const processedData = processOcrResult(rawData);
      
      console.log("📋 [OCR Route] Processed data:", JSON.stringify(processedData, null, 2));
      
      console.log("✅ [OCR Route] Processed OCR data:", processedData);
      res.json(processedData);
      return;
    } catch (err: any) {
      console.error("❌ [OCR Route] Error:", err);
      console.error("❌ [OCR Route] Error message:", err?.message);
      console.error("❌ [OCR Route] Error stack:", err?.stack);
      
      // ✅ จัดการ error แบบละเอียดขึ้น
      let statusCode = 500;
      let errorMessage = "Internal Server Error";
      
      if (err?.message) {
        if (err.message.includes('timeout')) {
          statusCode = 504; // Gateway Timeout
          errorMessage = "OCR request timeout. Please try again or use a smaller image.";
        } else if (err.message.includes('Network connection')) {
          statusCode = 503; // Service Unavailable
          errorMessage = "Cannot connect to OCR service. Please check your internet connection.";
        } else if (err.message.includes('Missing TYPHOON_API_KEY')) {
          statusCode = 500;
          errorMessage = "OCR service configuration error.";
        } else if (err.message.includes('Typhoon OCR error')) {
          statusCode = 502; // Bad Gateway
          errorMessage = `OCR service error: ${err.message}`;
        } else {
          errorMessage = err.message;
        }
      }
      
      res.status(statusCode).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? err?.message : undefined
      });
      return;
    }
  }
);

export default router;
