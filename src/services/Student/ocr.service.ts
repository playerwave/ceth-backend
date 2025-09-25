// src/services/Student/ocr.service.ts
export interface OcrParams {
  model?: string;
}

export async function callTyphoonOCR(
  file: { buffer: Buffer; filename: string; mimetype?: string },
  params: OcrParams = {}
) {
  console.log("🔑 [OCR Service] Checking TYPHOON_API_KEY...");
  console.log("🔑 [OCR Service] TYPHOON_API_KEY exists:", !!process.env.TYPHOON_API_KEY);
  
  if (!process.env.TYPHOON_API_KEY) {
    console.error("❌ [OCR Service] Missing TYPHOON_API_KEY");
    throw new Error("Missing TYPHOON_API_KEY");
  }

  const formData = new FormData();

  // ✅ แก้จุดเออเรอ: แปลง Buffer -> ArrayBuffer เฉพาะช่วงที่ใช้งาน
  const ab = file.buffer.buffer.slice(
    file.buffer.byteOffset,
    file.buffer.byteOffset + file.buffer.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([ab], {
    type: file.mimetype || "application/octet-stream",
  });

  formData.append("file", blob, file.filename);
  formData.append(
    "params",
    JSON.stringify({ model: params.model || "typhoon-ocr-preview" })
  );

  console.log("🌐 [OCR Service] Calling Typhoon API...");
  const r = await fetch("https://api.opentyphoon.ai/v1/ocr", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.TYPHOON_API_KEY}` },
    body: formData,
  });

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
}
