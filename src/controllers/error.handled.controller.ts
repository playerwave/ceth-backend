import { Response } from "express";
import logger from "../utils/logger";

export abstract class ErrorHandledController {
  protected handleError(context: string, error: unknown, res: Response): void {
    if (error instanceof Error) {
      logger.error(`❌ Error in ${context}`, {
        message: error.message,
        stack: error.stack,
      });
    } else {
      logger.error(`❌ Unknown Error in ${context}`, { raw: error });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
}
