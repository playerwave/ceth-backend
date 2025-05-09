import logger from "../utils/logger";

export abstract class ErrorHandledService {
  protected logInfo(message: string, meta?: any): void {
    logger.info(message, meta);
  }

  protected logError(message: string, error: unknown): void {
    logger.error(message, {
      ...(error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { raw: error }),
    });
  }
}
