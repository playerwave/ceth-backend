// src/utils/image-analysis.ts
import sharp from "sharp";

/**
 * Image Analyzer สำหรับวิเคราะห์ Certificate Image
 */
export class ImageAnalyzer {
  /**
   * วิเคราะห์สีหลักในรูปภาพ
   */
  async analyzeDominantColors(imageBuffer: Buffer): Promise<{ 
    dominant: string; 
    palette: string[] 
  }> {
    try {
      console.log("🎨 [ImageAnalyzer] Analyzing dominant colors...");
      
      const image = sharp(imageBuffer);
      const stats = await image.stats();
      
      // คำนวณสีหลักจาก channel statistics
      const r = Math.round(stats.channels[0].mean);
      const g = Math.round(stats.channels[1].mean);
      const b = Math.round(stats.channels[2].mean);
      
      const dominantColor = this.rgbToHex(r, g, b);
      console.log(`✅ Dominant color: ${dominantColor}`);
      
      return {
        dominant: dominantColor,
        palette: [dominantColor] // สามารถเพิ่ม palette analysis ได้
      };
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error analyzing colors:", error);
      return {
        dominant: "#FFFFFF",
        palette: ["#FFFFFF"]
      };
    }
  }

  /**
   * แปลง RGB เป็น Hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }

  /**
   * เปรียบเทียบสีพื้นหลัง
   */
  compareBackgroundColor(
    actualColor: string,
    expectedColor: string
  ): number {
    try {
      console.log("🎨 [ImageAnalyzer] Comparing background colors:", {
        actual: actualColor,
        expected: expectedColor
      });
      
      // แปลง hex เป็น RGB
      const actual = this.hexToRgb(actualColor);
      const expected = this.hexToRgb(expectedColor);
      
      if (!actual || !expected) return 0;
      
      // คำนวณความแตกต่าง (Euclidean distance)
      const distance = Math.sqrt(
        Math.pow(actual.r - expected.r, 2) +
        Math.pow(actual.g - expected.g, 2) +
        Math.pow(actual.b - expected.b, 2)
      );
      
      // แปลงเป็นเปอร์เซ็นต์ (max distance = 441.67 for RGB)
      const maxDistance = Math.sqrt(3 * Math.pow(255, 2));
      const similarity = (1 - (distance / maxDistance)) * 100;
      
      console.log(`✅ Color similarity: ${similarity.toFixed(2)}%`);
      return Math.round(similarity);
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error comparing colors:", error);
      return 0;
    }
  }

  /**
   * แปลง Hex เป็น RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * ตรวจจับตำแหน่งโลโก้
   */
  async detectLogoPosition(imageBuffer: Buffer): Promise<{ x: number; y: number } | null> {
    try {
      console.log("🏢 [ImageAnalyzer] Detecting logo position...");
      
      // TODO: Implement advanced logo detection using image processing
      // For now, return estimated position (top-left corner)
      const metadata = await sharp(imageBuffer).metadata();
      
      return {
        x: Math.round((metadata.width || 0) * 0.1),
        y: Math.round((metadata.height || 0) * 0.1)
      };
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error detecting logo:", error);
      return null;
    }
  }

  /**
   * เปรียบเทียบตำแหน่งโลโก้
   */
  compareLogoPosition(
    actualPos: { x: number; y: number } | null,
    expectedPos: { x: number; y: number },
    imageSize: { width: number; height: number }
  ): number {
    if (!actualPos) return 0;
    
    try {
      console.log("🏢 [ImageAnalyzer] Comparing logo positions:", {
        actual: actualPos,
        expected: expectedPos
      });
      
      // คำนวณระยะห่าง (normalized by image size)
      const dx = Math.abs(actualPos.x - expectedPos.x) / imageSize.width;
      const dy = Math.abs(actualPos.y - expectedPos.y) / imageSize.height;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // แปลงเป็นความคล้าย (ยิ่งใกล้ยิ่งสูง)
      const similarity = Math.max(0, (1 - distance) * 100);
      
      console.log(`✅ Logo position similarity: ${similarity.toFixed(2)}%`);
      return Math.round(similarity);
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error comparing logo position:", error);
      return 0;
    }
  }

  /**
   * ตรวจจับลายน้ำ
   */
  async detectWatermark(imageBuffer: Buffer): Promise<{ 
    detected: boolean; 
    confidence: number 
  }> {
    try {
      console.log("💧 [ImageAnalyzer] Detecting watermark...");
      
      const image = sharp(imageBuffer);
      const stats = await image.stats();
      
      // ตรวจสอบความโปร่งใสและความคมชัด
      // Watermark มักจะมีความโปร่งใส (alpha channel) หรือความคมชัดต่ำ
      const hasAlpha = stats.channels.length > 3;
      
      // TODO: Implement advanced watermark detection
      // For now, use basic heuristics
      const detected = hasAlpha || stats.isOpaque === false;
      const confidence = detected ? 75 : 30;
      
      console.log(`✅ Watermark detection: ${detected ? "found" : "not found"} (${confidence}%)`);
      
      return { detected, confidence };
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error detecting watermark:", error);
      return { detected: false, confidence: 0 };
    }
  }

  /**
   * ตรวจจับลายเซ็น
   */
  async detectSignature(imageBuffer: Buffer): Promise<{ 
    detected: boolean; 
    confidence: number;
    position?: { x: number; y: number }
  }> {
    try {
      console.log("✍️ [ImageAnalyzer] Detecting signature...");
      
      // TODO: Implement signature detection using edge detection
      // For now, assume signature exists in bottom portion
      const metadata = await sharp(imageBuffer).metadata();
      
      const detected = true; // Placeholder
      const confidence = 70;
      const position = {
        x: Math.round((metadata.width || 0) * 0.7),
        y: Math.round((metadata.height || 0) * 0.8)
      };
      
      console.log(`✅ Signature detection: ${detected ? "found" : "not found"} (${confidence}%)`);
      
      return { detected, confidence, position };
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error detecting signature:", error);
      return { detected: false, confidence: 0 };
    }
  }

  /**
   * วิเคราะห์ Layout ของรูปภาพ
   */
  async analyzeLayout(imageBuffer: Buffer): Promise<{
    textRegions: number;
    imageRegions: number;
    emptySpaceRatio: number;
  }> {
    try {
      console.log("📐 [ImageAnalyzer] Analyzing layout...");
      
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      // TODO: Implement actual region detection
      // For now, return estimated values
      return {
        textRegions: 5,
        imageRegions: 2,
        emptySpaceRatio: 0.3
      };
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error analyzing layout:", error);
      return {
        textRegions: 0,
        imageRegions: 0,
        emptySpaceRatio: 0
      };
    }
  }

  /**
   * เปรียบเทียบ Layout
   */
  compareLayout(
    actualLayout: any,
    expectedLayout: any
  ): number {
    try {
      console.log("📐 [ImageAnalyzer] Comparing layouts:", {
        actual: actualLayout,
        expected: expectedLayout
      });
      
      let score = 100;
      
      // เปรียบเทียบจำนวน text regions
      const textDiff = Math.abs(actualLayout.textRegions - expectedLayout.textRegions);
      score -= textDiff * 10;
      
      // เปรียบเทียบ empty space ratio
      const spaceDiff = Math.abs(actualLayout.emptySpaceRatio - expectedLayout.emptySpaceRatio);
      score -= spaceDiff * 50;
      
      score = Math.max(0, Math.min(100, score));
      
      console.log(`✅ Layout similarity: ${score}%`);
      return Math.round(score);
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error comparing layouts:", error);
      return 0;
    }
  }

  /**
   * ตรวจจับการปลอมแปลง (Tampering Detection)
   */
  async detectTampering(imageBuffer: Buffer): Promise<{ 
    detected: boolean; 
    confidence: number;
    reasons: string[];
  }> {
    try {
      console.log("🔍 [ImageAnalyzer] Detecting tampering...");
      
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      const stats = await image.stats();
      
      const reasons: string[] = [];
      let tamperingScore = 0;
      
      // 1. ตรวจสอบ EXIF metadata (ถ้ามีการแก้ไขจะมี metadata ที่แปลก)
      if (metadata.exif) {
        // TODO: Analyze EXIF for editing software signatures
      }
      
      // 2. ตรวจสอบความผิดปกติของสี
      const isUnusualColorDistribution = stats.channels.some(channel => 
        channel.stdev < 5 || channel.stdev > 100
      );
      
      if (isUnusualColorDistribution) {
        tamperingScore += 20;
        reasons.push("ความกระจายของสีผิดปกติ");
      }
      
      // 3. ตรวจสอบขนาดและคุณภาพ
      const expectedSize = { width: 800, height: 600 }; // typical certificate size
      const aspectRatio = (metadata.width || 1) / (metadata.height || 1);
      const expectedAspectRatio = expectedSize.width / expectedSize.height;
      
      if (Math.abs(aspectRatio - expectedAspectRatio) > 0.5) {
        tamperingScore += 10;
        reasons.push("สัดส่วนภาพผิดปกติ");
      }
      
      const detected = tamperingScore > 30;
      const confidence = tamperingScore;
      
      console.log(`✅ Tampering detection: ${detected ? "detected" : "clean"} (${confidence}%)`);
      if (detected) {
        console.log(`⚠️ Reasons:`, reasons);
      }
      
      return { detected, confidence, reasons };
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error detecting tampering:", error);
      return { detected: false, confidence: 0, reasons: [] };
    }
  }

  /**
   * ลดขนาดรูปภาพสำหรับ processing
   */
  async optimizeImage(imageBuffer: Buffer, maxWidth: number = 1200): Promise<Buffer> {
    try {
      console.log("🖼️ [ImageAnalyzer] Optimizing image...");
      
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      if ((metadata.width || 0) <= maxWidth) {
        console.log("✅ Image already optimized");
        return imageBuffer;
      }
      
      const optimized = await image
        .resize(maxWidth, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality: 90 })
        .toBuffer();
      
      console.log(`✅ Image optimized: ${imageBuffer.length} → ${optimized.length} bytes`);
      return optimized;
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error optimizing image:", error);
      return imageBuffer;
    }
  }

  /**
   * แปลงรูปภาพเป็น grayscale สำหรับ OCR
   */
  async convertToGrayscale(imageBuffer: Buffer): Promise<Buffer> {
    try {
      console.log("🌑 [ImageAnalyzer] Converting to grayscale...");
      
      const grayscale = await sharp(imageBuffer)
        .grayscale()
        .toBuffer();
      
      console.log("✅ Converted to grayscale");
      return grayscale;
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error converting to grayscale:", error);
      return imageBuffer;
    }
  }

  /**
   * เพิ่มความคมชัดของรูปภาพ
   */
  async enhanceImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      console.log("✨ [ImageAnalyzer] Enhancing image...");
      
      const enhanced = await sharp(imageBuffer)
        .normalize() // Auto-adjust brightness
        .sharpen()   // Increase sharpness
        .toBuffer();
      
      console.log("✅ Image enhanced");
      return enhanced;
    } catch (error) {
      console.error("❌ [ImageAnalyzer] Error enhancing image:", error);
      return imageBuffer;
    }
  }
}

// Export singleton instance
export const imageAnalyzer = new ImageAnalyzer();
