import { PDFDocument } from 'pdf-lib';

/**
 * Extract page 2 from PDF buffer (1-indexed, so page 2 is index 1)
 * Returns a new PDF buffer containing only page 2
 */
export async function extractPdfPage2(buffer: Buffer): Promise<Buffer> {
  try {
    console.log("📄 [PDF Page Extractor] Extracting page 2 from PDF...");
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    
    console.log("📄 [PDF Page Extractor] PDF has", pageCount, "pages");
    
    // Check if PDF has at least 2 pages
    if (pageCount < 2) {
      console.warn("⚠️ [PDF Page Extractor] PDF has less than 2 pages, using all pages");
      // Return original buffer if PDF has less than 2 pages
      return buffer;
    }
    
    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create();
    
    // Copy page 2 (index 1) from original PDF to new PDF
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [1]); // 1 = page 2 (0-indexed)
    newPdfDoc.addPage(copiedPage);
    
    // Serialize the new PDF to bytes
    const pdfBytes = await newPdfDoc.save();
    
    console.log("✅ [PDF Page Extractor] Successfully extracted page 2");
    console.log("📄 [PDF Page Extractor] New PDF size:", pdfBytes.length, "bytes");
    
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("❌ [PDF Page Extractor] Error extracting page 2:", error);
    // Return original buffer on error
    console.warn("⚠️ [PDF Page Extractor] Returning original PDF buffer due to error");
    return buffer;
  }
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(mimetype: string): boolean {
  return mimetype === 'application/pdf';
}

/**
 * Check if certificate type is THAI MOOC
 */
export function isThaiMooc(certificateType: string): boolean {
  return certificateType === 'THAI MOOC' || certificateType === 'THAI_MOOC';
}

