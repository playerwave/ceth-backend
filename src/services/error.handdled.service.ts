import logger from "../utils/logger";

export abstract class ErrorHandledService {
  protected logError(context: string, error: unknown): void {
    if (error instanceof Error) {
      logger.error(`❌ Error in ${context}`, {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });

      // เพิ่ม console สำหรับ dev
      console.error(`[${context}]`, error);
    } else {
      logger.error(`❌ Unknown error in ${context}`, { raw: error });
      console.error(`[${context}] Unknown error type:`, error);
    }
  }

  protected logInfo(message: string, metadata?: Record<string, any>): void {
    logger.info(`ℹ️ ${message}`, metadata || {});
  }
}
