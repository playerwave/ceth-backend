import logger from "../utils/logger";

export abstract class ErrorHandledDao {
  protected logQuery(query: string, params?: any): void {
    logger.info(`📄 SQL Query: ${query}`, { params });
  }

  protected logDbError(action: string, error: unknown): void {
    logger.error(`❌ DB Error during ${action}`, {
      ...(error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { raw: error }),
    });
  }
}
