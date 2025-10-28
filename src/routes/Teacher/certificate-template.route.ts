import { Router, Request, Response } from "express";
import multer from "multer";
import { callTyphoonOCR } from "../../services/Student/ocr.service";
import { imageAnalyzer } from "../../utils/imageAnalysis";
import cloudinary from "../../utils/cloudinary";
import { getCertificatePrompt } from "../../utils/validateCertificatePrompt";

const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });
const router = Router();

router.post(
  "/activity/:activityId/template",
  upload.single("certificate_file"),
  async (req: Request, res: Response): Promise<void> => {
    console.log("🔍 [Certificate Template Route] Uploading certificate template for activity:", req.params.activityId);
    
    try {
      if (!req.file) {
        console.log("❌ [Certificate Template Route] No file uploaded");
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      console.log("✅ [Certificate Template Route] File received:", {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        activityId: req.params.activityId
      });

      // Step 1: ทำ OCR เพื่อดึงข้อมูลจากใบรับรอง
      console.log("🔍 [Certificate Template Route] Performing OCR...");
      let ocrData = null;
      try {
        // ✅ ใช้ prompt เฉพาะสำหรับ BUU MOOC
        const certificatePrompt = getCertificatePrompt("BUU MOOC");
        
        const rawData = await callTyphoonOCR(
          {
            buffer: req.file.buffer,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
          },
          { 
            model: "typhoon-ocr-preview",
            prompt: certificatePrompt,
            certificateType: "BUU MOOC",
            enableCorrection: true
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

      // Step 3: อัปโหลดไป Cloudinary
      console.log("☁️ [Certificate Template Route] Uploading to Cloudinary...");
      let cloudinaryUrl = null;
      try {
        cloudinaryUrl = await new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              upload_preset: "ceth-project",
              resource_type: "auto",
              folder: "certificate-templates"
            },
            (error, result) => {
              if (error) {
                console.error("❌ [Cloudinary] Upload failed:", error);
                reject(error);
              } else if (result) {
                console.log("✅ [Cloudinary] Upload success:", result.secure_url);
                resolve(result.secure_url);
              } else {
                reject(new Error("Cloudinary upload failed: No result returned"));
              }
            }
          );
          
          // ส่ง Buffer ไปยัง upload stream
          uploadStream.end(req.file.buffer);
        });
      } catch (cloudinaryError) {
        console.error("❌ [Certificate Template Route] Cloudinary upload failed:", cloudinaryError);
        // ใช้ fallback URL
        cloudinaryUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }

      // Step 4: รวมผลลัพธ์
      const result = {
        success: true,
        data: {
          // ✅ ข้อมูลที่ Frontend ต้องการ
          certificate_template_url: cloudinaryUrl, // URL จาก Cloudinary
          certificate_ocr_data: ocrData,
          certificate_image_analysis: imageAnalysis,
          upload_certificate_description: req.body.description || "",
          
          // ✅ ข้อมูลเพิ่มเติม
          metadata: {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            activityId: req.params.activityId,
            analyzedAt: new Date().toISOString()
          }
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
        // ✅ ใช้ prompt เฉพาะสำหรับ BUU MOOC
        const certificatePrompt = getCertificatePrompt("BUU MOOC");
        
        const rawData = await callTyphoonOCR(
          {
            buffer: req.file.buffer,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
          },
          { 
            model: "typhoon-ocr-preview",
            prompt: certificatePrompt,
            certificateType: "BUU MOOC",
            enableCorrection: true
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

      // Step 3: อัปโหลดไป Cloudinary
      console.log("☁️ [Certificate Template Route] Uploading to Cloudinary...");
      let cloudinaryUrl = null;
      try {
        cloudinaryUrl = await new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              upload_preset: "ceth-project",
              resource_type: "auto",
              folder: "certificate-templates"
            },
            (error, result) => {
              if (error) {
                console.error("❌ [Cloudinary] Upload failed:", error);
                reject(error);
              } else if (result) {
                console.log("✅ [Cloudinary] Upload success:", result.secure_url);
                resolve(result.secure_url);
              } else {
                reject(new Error("Cloudinary upload failed: No result returned"));
              }
            }
          );
          
          // ส่ง Buffer ไปยัง upload stream
          uploadStream.end(req.file.buffer);
        });
      } catch (cloudinaryError) {
        console.error("❌ [Certificate Template Route] Cloudinary upload failed:", cloudinaryError);
        // ใช้ fallback URL
        cloudinaryUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }

      // Step 4: รวมผลลัพธ์
      const result = {
        success: true,
        data: {
          // ✅ ข้อมูลที่ Frontend ต้องการ
          certificate_template_url: cloudinaryUrl, // URL จาก Cloudinary
          certificate_ocr_data: ocrData,
          certificate_image_analysis: imageAnalysis,
          upload_certificate_description: req.body.description || "",
          
          // ✅ ข้อมูลเพิ่มเติม
          metadata: {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            analyzedAt: new Date().toISOString()
          }
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
