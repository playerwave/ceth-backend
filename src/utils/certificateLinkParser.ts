// src/utils/certificateLinkParser.ts

/**
 * Certificate Link Parser Types
 * กำหนด types สำหรับการ parse ข้อมูลจากลิ้งก์ใบรับรอง
 */

export interface CertificateLinkData {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  isValid: boolean;
  error?: string;
}

export interface CertificateValidationResult {
  success: boolean;
  data?: CertificateLinkData;
  error?: string;
}

