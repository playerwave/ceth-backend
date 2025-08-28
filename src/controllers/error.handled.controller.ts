

import { Response } from "express";
import logger from "../utils/logger";

export abstract class ErrorHandledController {
  protected handleError(context: string, error: unknown, res: Response): void {
    // 🔍 Log รายละเอียดของ error
    if (error instanceof Error) {
      logger.error(`❌ Error in ${context}`, {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });

      // 💬 Log ไปที่ console เพิ่มเติมถ้าต้องการเห็นใน dev
      console.error(`[${context}]`, error);
    } else {
      logger.error(`❌ Unknown Error in ${context}`, { raw: error });
      console.error(`[${context}] Unknown error type:`, error);
    }

    // ⚠️ ส่ง response ที่ชัดเจนขึ้น (เฉพาะ dev ก็ได้)
    res.status(500).json({
      error: "Internal Server Error",
      context, // 👉 เพิ่ม context เผื่อ debugging
      timestamp: new Date().toISOString(), // 🕒 timestamp เพิ่มความชัด
    });
  }
}
