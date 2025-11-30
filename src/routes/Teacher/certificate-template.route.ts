import { Router, Request, Response } from "express";
import { uploadImage } from "../../middleware/multer"; // ✅ ใช้ uploadImage ที่รองรับ PDF แล้ว
import { callTyphoonOCR } from "../../services/Student/ocr.service";
import { imageAnalyzer } from "../../utils/imageAnalysis";
import cloudinary from "../../utils/cloudinary";
import { getCertificatePrompt } from "../../utils/validateCertificatePrompt";
import https from "https";
import http from "http";
import { CertificateDao } from "../../daos/Teacher/certificate.dao";
import { extractPdfPage2, isPdfFile } from "../../utils/pdfPageExtractor";
import { detectCertificateType } from "../../utils/naturalTextParser";

const router = Router();

/**
 * Helper function: Extract page 2 from PDF if it's THAI MOOC
 * Returns: { buffer: Buffer, certificateType: string }
 */
async function preparePdfBufferForOcr(
  fileBuffer: Buffer,
  filename: string,
  mimetype: string
): Promise<{ buffer: Buffer; certificateType: string }> {
  let bufferForOcr = fileBuffer;
  let certificateTypeForOcr = "BUU MOOC"; // Default
  
  // ✅ ถ้าเป็น PDF ให้ตรวจสอบว่าเป็น THAI MOOC หรือไม่
  if (isPdfFile(mimetype)) {
    console.log("📄 [Certificate Template Route] PDF detected, checking if THAI MOOC...");
    
    try {
      // ✅ ทำ OCR ครั้งแรกเพื่อ detect certificate type
      const firstOcrResult = await callTyphoonOCR(
        {
          buffer: fileBuffer,
          filename: filename,
          mimetype: mimetype,
        },
        { 
          model: "typhoon-ocr-preview",
          certificateType: "BUU MOOC",
          enableCorrection: true
        }
      );
      
      // ✅ Extract natural_text เพื่อตรวจสอบ certificate type
      let naturalText = "";
      if (firstOcrResult?.results?.[0]?.message?.choices?.[0]?.message?.content) {
        const content = firstOcrResult.results[0].message.choices[0].message.content;
        try {
          const parsed = JSON.parse(content);
          naturalText = parsed.natural_text || parsed.raw_text || content;
        } catch {
          naturalText = content;
        }
      }
      
      // ✅ Detect certificate type
      const detectedType = detectCertificateType(naturalText);
      console.log("🔍 [Certificate Template Route] Detected certificate type:", detectedType);
      
      // ✅ ถ้าเป็น THAI MOOC และเป็น PDF ให้ extract หน้า 2
      if (detectedType === "THAI MOOC") {
        console.log("📄 [Certificate Template Route] THAI MOOC PDF detected, extracting page 2...");
        bufferForOcr = await extractPdfPage2(fileBuffer);
        certificateTypeForOcr = "THAI MOOC";
      }
    } catch (error) {
      console.warn("⚠️ [Certificate Template Route] Error detecting certificate type, using default:", error);
      // Continue with original buffer and default type
    }
  }
  
  return { buffer: bufferForOcr, certificateType: certificateTypeForOcr };
}

router.post(
  "/activity/:activityId/template",
  uploadImage.single("certificate_file"), // ✅ ใช้ uploadImage ที่รองรับ PDF แล้ว
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
        activityId: req.params.activityId,
        isPdf: req.file.mimetype === 'application/pdf' // ✅ แสดงว่าเป็น PDF หรือไม่
      });

      // Step 1: ทำ OCR เพื่อดึงข้อมูลจากใบรับรอง
      console.log("🔍 [Certificate Template Route] Performing OCR...");
      let ocrData = null;
      
      // ✅ Prepare PDF buffer (extract page 2 if THAI MOOC)
      const { buffer: bufferForOcr, certificateType: certificateTypeForOcr } = await preparePdfBufferForOcr(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      
      try {
        // ✅ ใช้ prompt เฉพาะตาม certificate type
        const certificatePrompt = getCertificatePrompt(certificateTypeForOcr);
        
        const rawData = await callTyphoonOCR(
          {
            buffer: bufferForOcr,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
          },
          { 
            model: "typhoon-ocr-preview",
            prompt: certificatePrompt,
            certificateType: certificateTypeForOcr,
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

      // Step 2: ทำ Image Analysis (ข้ามถ้าเป็น PDF เพราะ imageAnalyzer อาจไม่รองรับ PDF)
      console.log("🎨 [Certificate Template Route] Performing image analysis...");
      let imageAnalysis = null;
      const isPdfFileRoute1 = req.file.mimetype === 'application/pdf';
      
      if (!isPdfFileRoute1) {
        // ✅ ทำ Image Analysis เฉพาะรูปภาพเท่านั้น
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
      } else {
        console.log("ℹ️ [Certificate Template Route] Skipping image analysis for PDF file");
        imageAnalysis = {
          note: "Image analysis skipped for PDF files"
        };
      }

      // Step 3: อัปโหลดไป Cloudinary
      console.log("☁️ [Certificate Template Route] Uploading to Cloudinary...");
      let cloudinaryUrl = null;
      
      try {
        cloudinaryUrl = await new Promise<string>((resolve, reject) => {
          // ✅ สำหรับ PDF: ใช้ resource_type: "raw" เพื่อให้แสดงได้ดี
          // ✅ สำหรับรูปภาพ: ใช้ resource_type: "auto"
          const uploadOptions: any = {
            upload_preset: "ceth-project",
            folder: "certificate-templates",
            overwrite: false,
            invalidate: true
          };
          
          // ✅ สำหรับ PDF ใช้ "raw" resource type
          if (isPdfFileRoute1) {
            uploadOptions.resource_type = "raw";
            uploadOptions.format = "pdf";
            // ✅ ไม่ตั้ง access_mode ที่นี่ เพราะอาจจะ override โดย upload preset
            // ✅ แต่จะพยายามใช้ public_id ที่สามารถเข้าถึงได้
            console.log("📄 [Cloudinary] Uploading PDF with raw resource_type");
          } else {
            uploadOptions.resource_type = "auto";
            console.log("🖼️ [Cloudinary] Uploading image with auto resource_type");
          }
          
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            async (error, result) => {
              if (error) {
                console.error("❌ [Cloudinary] Upload failed:", error);
                reject(error);
              } else if (result) {
                console.log("✅ [Cloudinary] Upload success:", result.secure_url);
                console.log("📊 [Cloudinary] Resource type:", result.resource_type);
                console.log("📊 [Cloudinary] Format:", result.format);
                console.log("📊 [Cloudinary] Public ID:", result.public_id);
                
                // ✅ สำหรับ PDF: ลอง update access_mode เป็น public (ถ้ายังไม่ใช่)
                if (isPdfFileRoute1 && result.public_id) {
                  try {
                    const updateResult = await cloudinary.uploader.explicit(result.public_id, {
                      resource_type: "raw",
                      type: "upload",
                      access_mode: "public",
                      invalidate: true
                    });
                    console.log("✅ [Cloudinary] Successfully set PDF to public:", updateResult.secure_url);
                    resolve(updateResult.secure_url);
                  } catch (updateError) {
                    console.warn("⚠️ [Cloudinary] Could not set PDF to public, using original URL:", updateError);
                    // ✅ ใช้ URL เดิม (อาจจะทำงานได้ถ้า upload preset ตั้งค่าให้ public)
                    resolve(result.secure_url);
                  }
                } else {
                  resolve(result.secure_url);
                }
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

      // Step 4: บันทึกลง database
      console.log("💾 [Certificate Template Route] Saving to database...");
      const certificateDao = new CertificateDao();
      const activityId = parseInt(req.params.activityId);
      
      try {
        await certificateDao.createActivityCertificateTemplate(activityId, {
          template_url: cloudinaryUrl || '',
          ocr_data: ocrData,
          image_analysis: imageAnalysis,
          description: req.body.description || null
        });
        console.log("✅ [Certificate Template Route] Saved to database successfully");
      } catch (dbError) {
        console.error("❌ [Certificate Template Route] Failed to save to database:", dbError);
        // ไม่ throw error เพื่อให้ส่ง response กลับไปได้
      }
      
      // Step 5: รวมผลลัพธ์
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
  uploadImage.single("certificate"), // ✅ ใช้ uploadImage ที่รองรับ PDF แล้ว
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
      
      // ✅ Prepare PDF buffer (extract page 2 if THAI MOOC)
      const { buffer: bufferForOcr, certificateType: certificateTypeForOcr } = await preparePdfBufferForOcr(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      
      try {
        // ✅ ใช้ prompt เฉพาะตาม certificate type
        const certificatePrompt = getCertificatePrompt(certificateTypeForOcr);
        
        const rawData = await callTyphoonOCR(
          {
            buffer: bufferForOcr,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
          },
          { 
            model: "typhoon-ocr-preview",
            prompt: certificatePrompt,
            certificateType: certificateTypeForOcr,
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

      // Step 2: ทำ Image Analysis (ข้ามถ้าเป็น PDF)
      console.log("🎨 [Certificate Template Route] Performing image analysis...");
      let imageAnalysis = null;
      const isPdfFileAnalyze = req.file.mimetype === 'application/pdf';
      
      if (!isPdfFileAnalyze) {
        // ✅ ทำ Image Analysis เฉพาะรูปภาพเท่านั้น
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
      } else {
        console.log("ℹ️ [Certificate Template Route] Skipping image analysis for PDF file");
        imageAnalysis = {
          note: "Image analysis skipped for PDF files"
        };
      }

      // Step 3: อัปโหลดไป Cloudinary
      console.log("☁️ [Certificate Template Route] Uploading to Cloudinary...");
      let cloudinaryUrl = null;
      
      try {
        cloudinaryUrl = await new Promise<string>((resolve, reject) => {
          const uploadOptions: any = {
            upload_preset: "ceth-project",
            folder: "certificate-templates",
            overwrite: false,
            invalidate: true
          };
          
          // ✅ สำหรับ PDF ใช้ "raw" resource type
          if (isPdfFileAnalyze) {
            uploadOptions.resource_type = "raw";
            uploadOptions.format = "pdf";
            console.log("📄 [Cloudinary] Uploading PDF with raw resource_type");
          } else {
            uploadOptions.resource_type = "auto";
            console.log("🖼️ [Cloudinary] Uploading image with auto resource_type");
          }
          
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            async (error, result) => {
              if (error) {
                console.error("❌ [Cloudinary] Upload failed:", error);
                reject(error);
              } else if (result) {
                console.log("✅ [Cloudinary] Upload success:", result.secure_url);
                console.log("📊 [Cloudinary] Resource type:", result.resource_type);
                
                // ✅ สำหรับ PDF: ลอง update access_mode เป็น public
                if (isPdfFileAnalyze && result.public_id) {
                  try {
                    const updateResult = await cloudinary.uploader.explicit(result.public_id, {
                      resource_type: "raw",
                      type: "upload",
                      access_mode: "public",
                      invalidate: true
                    });
                    console.log("✅ [Cloudinary] Successfully set PDF to public:", updateResult.secure_url);
                    resolve(updateResult.secure_url);
                  } catch (updateError) {
                    console.warn("⚠️ [Cloudinary] Could not set PDF to public, using original URL:", updateError);
                    resolve(result.secure_url);
                  }
                } else {
                  resolve(result.secure_url);
                }
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

// ✅ GET endpoint เพื่อ proxy PDF จาก Cloudinary (แก้ปัญหา 401 สำหรับไฟล์ private)
router.get(
  "/proxy-pdf",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        console.error("❌ [Certificate Template Route] Missing URL parameter");
        res.status(400).json({ error: "Missing or invalid URL parameter" });
        return;
      }

      // ✅ ตรวจสอบว่าเป็น Cloudinary URL
      if (!url.includes('cloudinary.com')) {
        console.error("❌ [Certificate Template Route] Invalid Cloudinary URL:", url);
        res.status(400).json({ error: "Invalid Cloudinary URL" });
        return;
      }

      console.log("📄 [Certificate Template Route] Proxying PDF from Cloudinary:", url);

      try {
        // ✅ ใช้ URL เดิมโดยตรง (ไม่ต้อง parse เพราะอาจมีปัญหา)
        // ถ้าเป็น Cloudinary URL ควรเข้าถึงได้โดยตรง
        
        // ✅ ลบ query parameters ที่อาจทำให้เกิดปัญหา (เช่น fl_attachment)
        let cleanUrl = url.split('?')[0];
        console.log("📄 [Certificate Template Route] Clean URL:", cleanUrl);

        // ✅ ใช้ Node.js https module เพื่อดาวน์โหลดไฟล์
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
          try {
            const urlObj = new URL(cleanUrl);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            console.log("📄 [Certificate Template Route] Starting download from:", urlObj.hostname + urlObj.pathname);
            
            const request = client.get(urlObj, (response) => {
              console.log("📄 [Certificate Template Route] Response status:", response.statusCode, response.statusMessage);
              console.log("📄 [Certificate Template Route] Response headers:", JSON.stringify(response.headers, null, 2));
              
              if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
                const errorMsg = `Failed to fetch PDF: ${response.statusCode || 'unknown'} ${response.statusMessage || 'unknown error'}`;
                console.error("❌ [Certificate Template Route]", errorMsg);
                
                // ✅ อ่าน error response body เพื่อดูรายละเอียด
                let errorBody = '';
                response.on('data', (chunk) => {
                  errorBody += chunk.toString();
                });
                response.on('end', () => {
                  console.error("❌ [Certificate Template Route] Error response body:", errorBody);
                  
                  // ✅ ถ้าเป็น 401 หรือ 403 อาจเป็นเพราะไฟล์เป็น private
                  if (response.statusCode === 401 || response.statusCode === 403) {
                    reject(new Error("PDF file is private and cannot be accessed (401/403). Please re-upload the PDF to make it public."));
                    return;
                  }
                  
                  reject(new Error(errorMsg));
                });
                return;
              }

              const chunks: Buffer[] = [];
              response.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
              });

              response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                console.log("✅ [Certificate Template Route] PDF buffer size:", buffer.length, "bytes");
                
                // ✅ ตรวจสอบว่าได้ PDF file จริงๆ (เช็ค header)
                if (buffer.length === 0) {
                  reject(new Error("Received empty PDF file"));
                  return;
                }
                
                // ✅ PDF files ควรเริ่มต้นด้วย %PDF
                if (!buffer.subarray(0, 4).toString().startsWith('%PDF')) {
                  console.warn("⚠️ [Certificate Template Route] File may not be a valid PDF (missing PDF header)");
                  // แต่ยังส่งต่อไป เพราะอาจเป็น compressed PDF
                }
                
                resolve(buffer);
              });

              response.on('error', (error) => {
                console.error("❌ [Certificate Template Route] Response error:", error);
                reject(error);
              });
            });

            request.on('error', (error) => {
              console.error("❌ [Certificate Template Route] Request error:", error);
              reject(error);
            });

            request.setTimeout(30000, () => {
              console.error("❌ [Certificate Template Route] Request timeout after 30s");
              request.destroy();
              reject(new Error("Request timeout after 30 seconds"));
            });
          } catch (urlError: any) {
            console.error("❌ [Certificate Template Route] URL parsing error:", urlError);
            reject(new Error(`Invalid URL: ${urlError.message}`));
          }
        });

        // ✅ ส่ง PDF ไปยัง client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="certificate.pdf"');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.send(pdfBuffer);

        console.log("✅ [Certificate Template Route] PDF proxied successfully");
      } catch (fetchError: any) {
        console.error("❌ [Certificate Template Route] Error proxying PDF:", fetchError);
        console.error("❌ [Certificate Template Route] Error details:", {
          message: fetchError?.message,
          stack: fetchError?.stack,
          name: fetchError?.name
        });
        
        // ✅ ถ้าเป็น private file error ให้ส่ง error message ที่ชัดเจน
        if (fetchError.message && fetchError.message.includes('private')) {
          res.status(403).json({ 
            error: "PDF file is private and cannot be accessed",
            suggestion: "Please re-upload the PDF file to make it public"
          });
          return;
        }
        
        res.status(500).json({ 
          error: "Failed to proxy PDF",
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
          suggestion: "Please check Cloudinary credentials and file permissions"
        });
      }
    } catch (error: any) {
      console.error("❌ [Certificate Template Route] Proxy error:", error);
      console.error("❌ [Certificate Template Route] Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      res.status(500).json({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

export default router;
