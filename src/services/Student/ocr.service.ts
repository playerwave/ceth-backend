// src/services/Student/ocr.service.ts
export interface OcrParams {
  model?: string;
}

export async function callTyphoonOCR(
  file: { buffer: Buffer; filename: string; mimetype?: string },
  params: OcrParams = {}
) {
  if (!process.env.TYPHOON_API_KEY) {
    throw new Error("Missing TYPHOON_API_KEY");
  }

  const formData = new FormData();

  // ✅ แก้จุดเออเรอ: แปลง Buffer -> ArrayBuffer เฉพาะช่วงที่ใช้งาน
  const ab = file.buffer.buffer.slice(
    file.buffer.byteOffset,
    file.buffer.byteOffset + file.buffer.byteLength
  );
  const blob = new Blob([ab], {
    type: file.mimetype || "application/octet-stream",
  });

  formData.append("file", blob, file.filename);
  formData.append(
    "params",
    JSON.stringify({ model: params.model || "typhoon-ocr-preview" })
  );

  const r = await fetch("https://api.opentyphoon.ai/v1/ocr", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.TYPHOON_API_KEY}` },
    body: formData,
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Typhoon OCR error: ${r.status} ${text}`);
  }
  return r.json();
}
