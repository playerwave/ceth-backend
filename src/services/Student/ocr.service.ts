// src/services/Student/ocr.service.ts
export interface OcrParams {
  model?: string;
  prompt?: string;
}

/**
 * ตรวจสอบสุขภาพของ Typhoon API
 */
async function checkTyphoonAPIHealth(): Promise<boolean> {
  try {
    console.log("🏥 [OCR Service] Checking Typhoon API health...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 วินาที
    
    const response = await fetch("https://api.opentyphoon.ai/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.TYPHOON_API_KEY}` },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log(`✅ [OCR Service] API health check: ${response.ok ? "healthy" : "unhealthy"}`);
    return response.ok;
  } catch (error) {
    console.error("⚠️ [OCR Service] API health check failed:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * เรียกใช้ Typhoon OCR พร้อม timeout และ retry
 */
async function callTyphoonOCRWithTimeout(
  file: { buffer: Buffer; filename: string; mimetype?: string },
  params: OcrParams = {},
  timeoutMs: number = 300000 // 300 วินาที (5 นาที)
) {
  console.log("🔑 [OCR Service] Checking TYPHOON_API_KEY...");
  console.log("🔑 [OCR Service] TYPHOON_API_KEY exists:", !!process.env.TYPHOON_API_KEY);
  
  if (!process.env.TYPHOON_API_KEY) {
    console.error("❌ [OCR Service] Missing TYPHOON_API_KEY");
    throw new Error("Missing TYPHOON_API_KEY");
  }

  const formData = new FormData();

  // ✅ แปลง Buffer -> ArrayBuffer
  const ab = file.buffer.buffer.slice(
    file.buffer.byteOffset,
    file.buffer.byteOffset + file.buffer.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([ab], {
    type: file.mimetype || "application/octet-stream",
  });

  formData.append("file", blob, file.filename);
  
  // ✅ เพิ่ม structured prompt
  const ocrParams: any = { 
    model: params.model || "typhoon-ocr-preview"
  };
  
  // ✅ Default structured prompt สำหรับ Certificate OCR
  const defaultPrompt = `You are a certificate OCR specialist. Extract the following information from this certificate image and return ONLY a valid JSON object with these exact keys:

{
  "student_name": "Full name of the student (extract ONLY the name, not phrases like 'THIS CERTIFICATE IS AWARDED TO')",
  "course_name": "Complete name of the course or program (include any additional information like hours in parentheses)",
  "instructor_name": "Name of the instructor, teacher, university, or awarding institution (if available, otherwise use '-')",
  "certificate_id": "Certificate ID or serial number (if available, otherwise use '-')",
  "completion_date": "Date of completion (extract in format DD Month YYYY or similar)",
  "raw_text": "All visible text from the certificate"
}

EXTRACTION RULES:
1. For student_name: Look for phrases like "THIS CERTIFICATE IS AWARDED TO", "PRESENTED TO", "AWARDED TO" and extract ONLY the name that follows (e.g., "Napatsakorn Kultangwattana")
2. For course_name: Look for phrases like "for the completion of", "completion of the course", "online course" and extract the COMPLETE course name including any additional information (e.g., "English for Communication (10 Hours)")
3. For instructor_name: Look for names below signatures, titles like "Professor", "Director", "Associate Professor", OR university names like "Chiang Mai University", "Awarded by [University Name]"
4. For completion_date: Look for dates near "Awarded by", "Date", "on [date]" (e.g., "24 June 2025")
5. For certificate_id: Look for ID numbers, serial numbers, or codes (if not found, use "-")
6. If any information is not found, use "-" as the value
7. Return ONLY the JSON object, no additional text or explanations

IMPORTANT: Return ONLY valid JSON, no markdown formatting or additional text.`;
  
  if (params.prompt) {
    ocrParams.prompt = params.prompt;
  } else {
    ocrParams.prompt = defaultPrompt;
  }
  
  formData.append("params", JSON.stringify(ocrParams));

  // ✅ สร้าง AbortController สำหรับ timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`❌ [OCR Service] Request timeout after ${timeoutMs}ms`);
    controller.abort();
  }, timeoutMs);

  try {
    console.log("🌐 [OCR Service] Calling Typhoon API...");
    console.log("📊 [OCR Service] File info:", {
      filename: file.filename,
      size: file.buffer.length,
      mimetype: file.mimetype,
      timeout: `${timeoutMs}ms`
    });

        const r = await fetch("https://api.opentyphoon.ai/v1/ocr", {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${process.env.TYPHOON_API_KEY}`,
            "User-Agent": "CETH-Certificate-Analyzer/1.0"
          },
          body: formData,
          signal: controller.signal
        });

    clearTimeout(timeoutId);
    console.log("📡 [OCR Service] Typhoon API response status:", r.status);
    
    if (!r.ok) {
      const text = await r.text();
      console.error("❌ [OCR Service] Typhoon API error:", r.status, text);
      throw new Error(`Typhoon OCR error: ${r.status} ${text}`);
    }
    
    console.log("✅ [OCR Service] Typhoon API success, parsing JSON...");
    const result = await r.json();
    console.log("✅ [OCR Service] JSON parsed successfully");
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`❌ [OCR Service] Request aborted due to timeout (${timeoutMs}ms)`);
        throw new Error(`OCR request timeout after ${timeoutMs}ms`);
      }
      
      if (error.message.includes('ETIMEDOUT') || error.message.includes('fetch failed')) {
        console.error("❌ [OCR Service] Network timeout or connection failed");
        throw new Error("Network connection to Typhoon API failed. Please check your internet connection.");
      }
    }
    
    throw error;
  }
}

/**
 * เรียกใช้ Typhoon OCR พร้อม retry logic
 */
export async function callTyphoonOCR(
  file: { buffer: Buffer; filename: string; mimetype?: string },
  params: OcrParams = {},
  maxRetries: number = 5
) {
  console.log(`🔄 [OCR Service] Starting OCR with retry (max: ${maxRetries})`);
  
  // ✅ ตรวจสอบ API health ก่อน
  const isHealthy = await checkTyphoonAPIHealth();
  if (!isHealthy) {
    console.warn("⚠️ [OCR Service] API health check failed, but proceeding anyway...");
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [OCR Service] Attempt ${attempt}/${maxRetries}`);
      
      // ✅ เพิ่ม timeout สำหรับแต่ละ attempt
      const timeout = 60000 * attempt; // เพิ่ม timeout ตาม attempt (60s, 120s, 180s)
      const result = await callTyphoonOCRWithTimeout(file, params, timeout);
      
      console.log(`✅ [OCR Service] Successfully completed on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ [OCR Service] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      // ✅ ถ้ายังไม่ถึงครั้งสุดท้าย ให้รอก่อน retry
      if (attempt < maxRetries) {
        const waitTime = 2000 * attempt; // รอ 2s, 4s, 6s
        console.log(`⏳ [OCR Service] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // ✅ ถ้า retry ครบทุกครั้งแล้วยังไม่สำเร็จ
  console.error(`❌ [OCR Service] All ${maxRetries} attempts failed`);
  throw new Error(`OCR failed after ${maxRetries} attempts: ${lastError?.message}`);
}
