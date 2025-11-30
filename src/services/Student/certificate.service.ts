// src/services/Student/certificate.service.ts
import { CertificateDAO } from "../../daos/Student/certificate.dao";
import { StudentsDao } from "../../daos/Student/student.dao";
import * as fs from "fs";
import * as path from "path";

export class CertificateService {
  private certificateDAO: CertificateDAO;
  private studentsDao: StudentsDao;

  constructor() {
    this.certificateDAO = new CertificateDAO();
    this.studentsDao = new StudentsDao();
  }

  //--------------------- Upload Certificate -------------------------
  async uploadCertificate(data: {
    students_id: number;
    activity_id: number;
    hours?: number;
    date?: Date | string | null;
    file: Express.Multer.File;
    ocr_extracted_data?: any;
  }): Promise<any> {
    console.log("📤 [Certificate Service] Uploading certificate for student:", data.students_id);
    
    try {
      // สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
      const uploadsDir = path.join(__dirname, "../../../uploads/certificates");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // สร้างชื่อไฟล์ที่ไม่ซ้ำ
      const timestamp = Date.now();
      const fileExtension = path.extname(data.file.originalname);
      const filename = `cert_${data.students_id}_${timestamp}${fileExtension}`;
      const filepath = path.join(uploadsDir, filename);

      // บันทึกไฟล์
      fs.writeFileSync(filepath, data.file.buffer);
      console.log("💾 [Certificate Service] File saved:", filepath);

      // ✅ ตรวจสอบและแปลง date ให้ถูกต้อง
      let certificateDate: Date | null = null;
      if (data.date) {
        // ✅ ถ้าเป็น Date object ให้ตรวจสอบว่า valid หรือไม่
        if (data.date instanceof Date) {
          if (!isNaN(data.date.getTime())) {
            certificateDate = data.date;
          }
        } else if (typeof data.date === 'string') {
          const dateStr = data.date.trim();
          if (dateStr !== "" && dateStr !== "-") {
            // ✅ ถ้าเป็น string ให้แปลงเป็น Date
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              certificateDate = parsedDate;
            }
          }
        }
      }
      // ✅ ถ้าไม่มี valid date ให้เป็น null
      
      // ✅ กำหนด status จาก ocr_extracted_data ถ้ามี (Pass/Pending)
      // ✅ ถ้าไม่มีให้ใช้ "Pending" เป็น default
      const certificateStatus = (data.ocr_extracted_data?.status as 'Pass' | 'Pending') || "Pending";
      
      // สร้าง certificate record
      const certificate = await this.certificateDAO.createCertificate({
        students_id: data.students_id,
        activity_id: data.activity_id,
        hours: data.hours,
        date: certificateDate, // ✅ ใช้ null ถ้าไม่มี valid date
        img: `/uploads/certificates/${filename}`,
        original_filename: data.file.originalname,
        file_type: data.file.mimetype,
        file_size: data.file.size,
        ocr_extracted_data: data.ocr_extracted_data,
        status: certificateStatus // ✅ ใช้ status ที่กำหนด (Pass หรือ Pending)
      });

      console.log("✅ [Certificate Service] Certificate created:", certificate.certificate_id);
      return certificate;
    } catch (error) {
      console.error("❌ [Certificate Service] Upload error:", error);
      throw error;
    }
  }

  //--------------------- Get Certificate By Id -------------------------
  async getCertificateById(certificateId: number, userId: number): Promise<any> {
    console.log("🔍 [Certificate Service] Getting certificate:", { certificateId, userId });
    
    try {
      const certificate = await this.certificateDAO.getCertificateById(certificateId, userId);
      
      if (!certificate) {
        console.log("❌ [Certificate Service] Certificate not found or access denied");
        return null;
      }

      console.log("✅ [Certificate Service] Certificate found:", certificate);
      return certificate;
    } catch (error) {
      console.error("❌ [Certificate Service] Error:", error);
      throw error;
    }
  }

  //--------------------- Get Certificates By Student ID -------------------------
  async getCertificatesByStudentId(studentId: number): Promise<any[]> {
    console.log("🔍 [Certificate Service] Getting certificates for student:", { studentId });
    
    try {
      const certificates = await this.certificateDAO.getCertificatesByStudentId(studentId);
      
      console.log("✅ [Certificate Service] Certificates found:", certificates.length);
      return certificates;
    } catch (error) {
      console.error("❌ [Certificate Service] Error:", error);
      throw error;
    }
  }

  //--------------------- Create Certificate -------------------------
  async createCertificate(data: any): Promise<any> {
    console.log("🔍 [Certificate Service] Creating certificate:", data);
    
    try {
      const certificate = await this.certificateDAO.createCertificate(data);
      
      console.log("✅ [Certificate Service] Certificate created:", certificate.certificate_id);
      return certificate;
    } catch (error) {
      console.error("❌ [Certificate Service] Create error:", error);
      throw error;
    }
  }

  //--------------------- Get Student ID From User ID -------------------------
  async getStudentIdFromUserId(userId: number): Promise<number | null> {
    console.log("🔍 [Certificate Service] Getting student ID from user ID:", { userId });
    
    try {
      const student = await this.studentsDao.getStudentByUserId(userId);
      return student?.students_id || null;
    } catch (error) {
      console.error("❌ [Certificate Service] Error getting student ID:", error);
      return null;
    }
  }
}
