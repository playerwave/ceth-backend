// src/controllers/Student/certificate-link.controller.ts

import { Request, Response } from 'express';

// ✅ กำหนด types ในไฟล์เดียวกัน
interface CertificateLinkData {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  isValid: boolean;
  error?: string;
}

/**
 * Controller สำหรับตรวจสอบลิ้งก์ใบรับรอง
 */
export class CertificateLinkController {
  
  /**
   * ตรวจสอบลิ้งก์ใบรับรอง BUU MOOC
   * POST /api/student/certificate/validate-link
   */
  async validateCertificateLink(req: Request, res: Response) {
    console.log("🚀 [CertificateLinkController] validateCertificateLink called");
    console.log("📝 [CertificateLinkController] Request body:", req.body);
    console.log("📝 [CertificateLinkController] Request headers:", req.headers);
    
    try {
      const { link, expectedStudentName } = req.body;
      
      console.log("🔍 [CertificateLinkController] Validating link:", link);
      
      // ✅ ตรวจสอบว่าเป็นลิ้งก์ BUU MOOC หรือไม่
      if (!link || !link.includes('mooc.buu.ac.th/certificates/')) {
        return res.status(400).json({
          success: false,
          error: 'ลิ้งก์ไม่ใช่ใบรับรอง BUU MOOC ที่ถูกต้อง'
        });
      }

      // ✅ ดึงข้อมูล HTML จากลิ้งก์
      const htmlContent = await this.fetchCertificatePage(link);
      
      if (!htmlContent) {
        return res.status(400).json({
          success: false,
          error: 'ไม่สามารถเข้าถึงลิ้งก์ได้'
        });
      }

      // ✅ Parse HTML และดึงข้อมูล
      const certificateData = this.parseCertificateHTML(htmlContent, expectedStudentName);
      
      console.log("✅ [CertificateLinkController] Validation completed:", certificateData);
      
      res.json({
        success: true,
        data: certificateData
      });

    } catch (error) {
      console.error("❌ [CertificateLinkController] Error:", error);
      console.error("❌ [CertificateLinkController] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("❌ [CertificateLinkController] Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      res.status(500).json({
        success: false,
        error: `เกิดข้อผิดพลาดในการตรวจสอบ: ${error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'}`
      });
    }
  }

  /**
   * ดึงข้อมูล HTML จากลิ้งก์
   */
  private async fetchCertificatePage(link: string): Promise<string | null> {
    try {
      console.log("🌐 [CertificateLinkController] Fetching page:", link);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      const response = await fetch(link, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log("✅ [CertificateLinkController] Page fetched successfully");
      return html;

    } catch (error) {
      console.error("❌ [CertificateLinkController] Fetch error:", error);
      
      // ✅ Try with different headers if first attempt fails
      try {
        console.log("🔄 [CertificateLinkController] Trying with different headers...");
        
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 15000);
        
        const response2 = await fetch(link, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CertificateValidator/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
          },
          signal: controller2.signal
        });
        
        clearTimeout(timeoutId2);

        if (!response2.ok) {
          throw new Error(`HTTP ${response2.status}: ${response2.statusText}`);
        }

        const html2 = await response2.text();
        console.log("✅ [CertificateLinkController] Page fetched successfully with alternative headers");
        return html2;

      } catch (error2) {
        console.error("❌ [CertificateLinkController] Alternative headers also failed:", error2);
        return null;
      }
    }
  }

  /**
   * Parse HTML และดึงข้อมูลใบรับรอง
   */
  private parseCertificateHTML(html: string, expectedStudentName?: string): CertificateLinkData {
    try {
      console.log("🔍 [CertificateLinkController] Parsing HTML content...");
      
      // ✅ 1. ดึงชื่อนิสิตจาก strong element
      const studentNameMatch = html.match(/<strong class="gold-line font-gold">([^<]+)<\/strong>/);
      const studentName = studentNameMatch ? studentNameMatch[1].trim() : '';
      
      console.log("👤 [CertificateLinkController] Student name found:", studentName);
      
      // ✅ 2. ดึงชื่อหลักสูตรจาก span ตัวที่ 4
      const courseNameMatch = html.match(/<span class="gold-line font-gold">([^<]+)<\/span>/);
      const courseName = courseNameMatch ? courseNameMatch[1].trim() : '';
      
      console.log("📚 [CertificateLinkController] Course name found:", courseName);
      
      // ✅ 3. ดึงวันที่จาก span ตัวที่ 5 (ตัดคำว่า "On" ออก)
      const dateMatch = html.match(/<span class="project-line">On\s+([^<]+)<\/span>/);
      const completionDate = dateMatch ? dateMatch[1].trim() : '';
      
      console.log("📅 [CertificateLinkController] Completion date found:", completionDate);
      
      // ✅ 4. ดึง Certificate ID
      const certificateIdMatch = html.match(/Certificate ID Number\s*:\s*([a-f0-9]+)/i);
      const certificateId = certificateIdMatch ? certificateIdMatch[1].trim() : '';
      
      console.log("🆔 [CertificateLinkController] Certificate ID found:", certificateId);
      
      // ✅ ตรวจสอบความถูกต้องของข้อมูล
      const isValid = this.validateCertificateData({
        studentName,
        courseName,
        completionDate,
        certificateId
      }, expectedStudentName);
      
      console.log("✅ [CertificateLinkController] Validation result:", isValid);
      
      return {
        studentName,
        courseName,
        completionDate,
        certificateId,
        isValid
      };

    } catch (error) {
      console.error("❌ [CertificateLinkController] Parse error:", error);
      return {
        studentName: '',
        courseName: '',
        completionDate: '',
        certificateId: '',
        isValid: false,
        error: `เกิดข้อผิดพลาดในการอ่านข้อมูล: ${error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'}`
      };
    }
  }

  /**
   * ตรวจสอบความถูกต้องของข้อมูล
   */
  private validateCertificateData(
    data: Omit<CertificateLinkData, 'isValid' | 'error'>, 
    expectedStudentName?: string
  ): boolean {
    console.log("🔍 [CertificateLinkController] Validating certificate data...");
    
    // ✅ ตรวจสอบข้อมูลพื้นฐาน
    if (!data.studentName || !data.courseName || !data.completionDate || !data.certificateId) {
      console.log("❌ [CertificateLinkController] Missing required fields");
      return false;
    }
    
    // ✅ ตรวจสอบชื่อนิสิต (ถ้ามีข้อมูลจากระบบ)
    if (expectedStudentName) {
      const normalizedExpected = expectedStudentName.toLowerCase().trim();
      const normalizedActual = data.studentName.toLowerCase().trim();
      
      console.log("👤 [CertificateLinkController] Name comparison:", {
        expected: normalizedExpected,
        actual: normalizedActual,
        match: normalizedActual.includes(normalizedExpected) || normalizedExpected.includes(normalizedActual)
      });
      
      // ✅ ตรวจสอบว่าชื่อตรงกันหรือไม่ (ใช้ partial match)
      if (!normalizedActual.includes(normalizedExpected) && !normalizedExpected.includes(normalizedActual)) {
        console.log("❌ [CertificateLinkController] Student name mismatch");
        return false;
      }
    }
    
    // ✅ ตรวจสอบรูปแบบวันที่
    const datePattern = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i;
    if (!datePattern.test(data.completionDate)) {
      console.log("❌ [CertificateLinkController] Invalid date format:", data.completionDate);
      return false;
    }
    
    // ✅ ตรวจสอบ Certificate ID (ควรเป็น hex string)
    const idPattern = /^[a-f0-9]{32,}$/i;
    if (!idPattern.test(data.certificateId)) {
      console.log("❌ [CertificateLinkController] Invalid certificate ID format:", data.certificateId);
      return false;
    }
    
    console.log("✅ [CertificateLinkController] All validations passed");
    return true;
  }
}

export default new CertificateLinkController();
