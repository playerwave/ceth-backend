import winston from "winston";
import { Request, Response, NextFunction } from "express";

// ✅ สร้าง Logger Instance
const logger = winston.createLogger({
  level: "info", // ระดับของ Log (info, warn, error, debug)
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // ✅ แสดง Log บน Console
    new winston.transports.File({ filename: "logs/app.log" }), // ✅ เก็บ Log ลงไฟล์
  ],
});

export default logger;

// ✅ Middleware สำหรับ Log Requests
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info(`📩 Request: ${req.method} ${req.url}`, {
    params: req.params,
    query: req.query,
    body: req.body,
  });
  next();
};

// ✅ Middleware สำหรับจับ Error และ Log
export const errorLogger = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("❌ Error occurred", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({ error: "Internal Server Error" });
};
