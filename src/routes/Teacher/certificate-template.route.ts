import { Router, Request, Response } from "express";
import multer from "multer";
import { callTyphoonOCR } from "../../services/Student/ocr.service";
import { imageAnalyzer } from "../../utils/image-analysis";

const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });
const router = Router();

// POST /api/teacher/certificate-template/analyze
router.post(
  "/analyze",
  upload.single("certificate"),
  async (req: Request, res: Response): Promise<void> => {
    console.log("🔍 [Certificate Template Route] Analyzing certificate template...");
    
    try {
      if (!req.file) {
        console.log("❌ [Certificate Template Route] No file uploaded");
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      console.log("✅ [Certificate Template Route] File received:", {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Step 1: ทำ OCR เพื่อดึงข้อมูลจากใบรับรอง
      console.log("🔍 [Certificate Template Route] Performing OCR...");
      let ocrData = null;
      try {
        const certificatePrompt = `
          You are an expert at extracting information from university certificates. Analyze this certificate image and extract ONLY the following information:

          EXTRACTION RULES:
          1. COURSE_NAME: Find the course title that appears after "for the completion and fulfillment of the online course" - this is the actual course name
          2. INSTRUCTOR_NAME: Find the name that appears below the signature area, usually with titles like "Associate Professor", "Director", etc.
          3. UNIVERSITY_NAME: Find the university name that appears after "Awarded by" or similar phrases
          4. COMPLETION_DATE: Find the date that appears after "Awarded by" or similar phrases
          5. CERTIFICATE_ID: Look for any alphanumeric ID, usually at the bottom or in a QR code area

          RETURN FORMAT - Must be valid JSON:
          {
            "course_name": "actual course name here",
            "instructor_name": "actual instructor name here", 
            "university_name": "actual university name here",
            "completion_date": "actual date here",
            "certificate_id": "actual certificate ID here",
            "raw_text": "complete OCR text for verification"
          }

          CRITICAL INSTRUCTIONS:
          - Extract ONLY the actual names and titles, not labels or descriptions
          - Do NOT extract phrases like "THIS CERTIFICATE IS AWARDED TO" as the course name
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

        console.log("🔍 [Certificate Template Route] Raw OCR data:", JSON.stringify(rawData, null, 2));

        // Process OCR result
        if (rawData?.results?.[0]?.message?.choices?.[0]?.message?.content) {
          const content = rawData.results[0].message.choices[0].message.content;
          try {
            ocrData = JSON.parse(content);
          } catch {
            ocrData = { raw_text: content };
          }
        }
        console.log("✅ [Certificate Template Route] OCR completed:", ocrData);
      } catch (ocrError) {
        console.warn("⚠️ [Certificate Template Route] OCR failed, continuing without OCR data:", ocrError);
        
        // ✅ Fallback: สร้าง dummy OCR data
        ocrData = {
          course_name: "-",
          instructor_name: "-", 
          university_name: "-",
          completion_date: "-",
          certificate_id: "-",
          raw_text: "OCR processing failed - manual review required"
        };
        console.log("🔄 [Certificate Template Route] Using fallback OCR data");
      }

      // Step 2: ทำ Image Analysis
      console.log("🎨 [Certificate Template Route] Performing image analysis...");
      let imageAnalysis = null;
      try {
        const dominantColors = await imageAnalyzer.analyzeDominantColors(req.file.buffer);
        const logoPosition = await imageAnalyzer.detectLogoPosition(req.file.buffer);
        const watermark = await imageAnalyzer.detectWatermark(req.file.buffer);
        const signature = await imageAnalyzer.detectSignature(req.file.buffer);
        const layout = await imageAnalyzer.analyzeLayout(req.file.buffer);

        imageAnalysis = {
          dominantColors,
          logoPosition,
          watermark,
          signature,
          layout
        };
        console.log("✅ [Certificate Template Route] Image analysis completed:", imageAnalysis);
      } catch (imageError) {
        console.warn("⚠️ [Certificate Template Route] Image analysis failed:", imageError);
      }

      // Step 3: รวมผลลัพธ์
      const result = {
        success: true,
        ocrData,
        imageAnalysis,
        metadata: {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          analyzedAt: new Date().toISOString()
        }
      };

      console.log("✅ [Certificate Template Route] Analysis completed successfully");
      res.json(result);
    } catch (error) {
      console.error("❌ [Certificate Template Route] Error:", error);
      res.status(500).json({ 
        error: "Failed to analyze certificate template",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

export default router;
