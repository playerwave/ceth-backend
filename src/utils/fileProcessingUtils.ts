import * as XLSX from "xlsx";

// Type definitions for file processing
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  path: string;
  size: number;
}

export interface StudentExcelData {
  name: string;
  engName: string;
  code: string;
  major: string;
  softSkill: number;
  hardSkill: number;
}

export interface BulkEnrollmentData {
  timestamp: string;  // ประทับเวลา
  studentId: string;  // รหัสนิสิต
  name: string;       // ชื่อ-สกุล
  department: string; // สาขาวิชา
  email: string;      // E-mail
}

export class FileProcessingUtils {
  
  // ✅ ตรวจสอบขนาดไฟล์
  static validateFileSize(file: MulterFile, maxSizeMB: number = 10): void {
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }
  }

  // ✅ อ่านไฟล์ Excel และแปลงเป็น JSON
  static readExcelFile<T = any>(filePath: string): T[] {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json<T>(workbook.Sheets[sheetName]);
  }

  // ✅ แปลงข้อมูลจาก Excel columns เป็น English format
  static mapBulkEnrollmentData(rawData: any[]): BulkEnrollmentData[] {
    return rawData
      .map((row: any) => ({
        timestamp: row['ประทับเวลา'],
        studentId: row['รหัสนิสิต'],
        name: row['ชื่อ-สกุล'] || '',
        department: row['สาขาวิชา'] || '',
        email: row['E-mail'] || ''
      }))
      .filter((row: BulkEnrollmentData) => {
        // ✅ กรองเอาเฉพาะแถวที่มีรหัสนิสิต
        if (!row.studentId) return false;
        
        // ✅ ทำความสะอาดรหัสนิสิต (เอาเฉพาะตัวเลข)
        const cleanStudentId = String(row.studentId).replace(/[^0-9]/g, '');
        
        // ✅ ตรวจสอบว่ารหัสนิสิตมีความยาวที่ถูกต้อง (8 หลัก)
        if (cleanStudentId.length !== 8) return false;
        
        // ✅ อัพเดท studentId เป็นค่าที่ทำความสะอาดแล้ว
        row.studentId = cleanStudentId;
        
        return true;
      });
  }

  // ✅ แสดงตัวอย่างข้อมูลที่ทำความสะอาดแล้ว
  static logSampleData(data: BulkEnrollmentData[], action: string, sampleSize: number = 3): void {
    if (data.length > 0) {
      console.log(`📋 Sample cleaned data for ${action}:`);
      data.slice(0, sampleSize).forEach((row, index) => {
        console.log(`  Row ${index + 1}: Student ID: ${row.studentId}, Name: ${row.name}`);
      });
    }
  }

  // ✅ ลบไฟล์ชั่วคราว
  static cleanupTempFile(filePath: string): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted temporary file: ${filePath}`);
      }
    } catch (deleteError) {
      console.error(`⚠️ Failed to delete temporary file: ${filePath}`, deleteError);
    }
  }

  // ✅ แยกชื่อและนามสกุล
  static splitName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName || typeof fullName !== 'string') {
      return { firstName: '', lastName: '' };
    }
    
    const trimmedName = fullName.trim();
    const lastSpaceIndex = trimmedName.lastIndexOf(' ');
    
    if (lastSpaceIndex === -1) {
      // ถ้าไม่มี space ให้ถือว่าเป็นชื่อทั้งหมด
      return { firstName: trimmedName, lastName: '' };
    }
    
    const firstName = trimmedName.substring(0, lastSpaceIndex).trim();
    const lastName = trimmedName.substring(lastSpaceIndex + 1).trim();
    
    return { firstName, lastName };
  }
}
