// src/routes/Student/ocr.route.ts
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

    // ✅ Parse JSON if content starts with {
    if (rawContent.trim().startsWith("{")) {
      try {
        const obj = JSON.parse(rawContent);
        rawContent = obj.natural_text || rawContent;
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

    // ✅ Find full name
    const namePatterns = [
      /ชื่อ[:\s]*(.+)/i,
      /Name[:\s]*(.+)/i,
      /Presented to[:\s]*(.+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = rawContent.match(pattern);
      if (match && match[1]) {
        fullName = match[1].trim();
        break;
      }
    }

    // ✅ Find course name
    const coursePatterns = [
      /หลักสูตร[:\s]*(.+)/i,
      /Course[:\s]*(.+)/i,
      /วิชา[:\s]*(.+)/i
    ];
    
    for (const pattern of coursePatterns) {
      const match = rawContent.match(pattern);
      if (match && match[1]) {
        courseName = match[1].trim();
        break;
      }
    }

    // ✅ Find teacher
    const teacherPatterns = [
      /อาจารย์[:\s]*(.+)/i,
      /Teacher[:\s]*(.+)/i,
      /Instructor[:\s]*(.+)/i
    ];
    
    for (const pattern of teacherPatterns) {
      const match = rawContent.match(pattern);
      if (match && match[1]) {
        teacher = match[1].trim();
        break;
      }
    }

    // ✅ Find date
    const datePatterns = [
      /วันที่[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /Date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/
    ];
    
    for (const pattern of datePatterns) {
      const match = rawContent.match(pattern);
      if (match && match[1]) {
        date = match[1].trim();
        break;
      }
    }

    // ✅ Find certificate ID
    const idPatterns = [
      /Certificate ID[:\s]*([A-Za-z0-9]+)/i,
      /ID[:\s]*([A-Za-z0-9]+)/i,
      /([A-Za-z0-9]{8,})/
    ];
    
    for (const pattern of idPatterns) {
      const match = rawContent.match(pattern);
      if (match && match[1]) {
        certificateId = match[1].trim();
        break;
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
      const rawData = await callTyphoonOCR(
        {
          buffer: req.file.buffer,
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
        },
        { model: "typhoon-ocr-preview" }
      );

      console.log("🔍 [OCR Route] Raw OCR data:", rawData);

      // ✅ Process OCR result ให้เป็น structured data
      const processedData = processOcrResult(rawData);
      
      console.log("✅ [OCR Route] Processed OCR data:", processedData);
      res.json(processedData);
      return;
    } catch (err: any) {
      console.error("❌ [OCR Route] Error:", err);
      console.error("❌ [OCR Route] Error message:", err?.message);
      console.error("❌ [OCR Route] Error stack:", err?.stack);
      res.status(500).json({ error: err?.message || "Internal Server Error" });
      return;
    }
  }
);

export default router;
