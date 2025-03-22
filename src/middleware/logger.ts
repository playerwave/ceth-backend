import winston from "winston";
import morgan from "morgan";
import { Request, Response, NextFunction } from "express";

// ✅ สร้าง Logger Instance ด้วย Winston พร้อมสีสันและจัดรูปแบบให้อ่านง่าย
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // ✅ ปรับ timestamp ให้ดูง่ายขึ้น
    winston.format.colorize(), // ✅ เพิ่มสีให้ log
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let metaString = Object.keys(meta).length
        ? `\n📌 Meta: ${JSON.stringify(meta, null, 2)}`
        : "";
      return `[${timestamp}] ${level}: ${message}${metaString}`;
    }),
  ),
  transports: [
    new winston.transports.Console(), // ✅ แสดง Log บน Console
    new winston.transports.File({
      filename: "logs/app.log",
      format: winston.format.json(),
    }), // ✅ เก็บ Log ลงไฟล์
  ],
});

export default logger;

// ✅ Middleware สำหรับ Log HTTP Requests ด้วย Morgan แบบอ่านง่าย
export const httpLogger = morgan("tiny", {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});

// ✅ Middleware สำหรับ Log Requests (Params, Query, Body) ให้ดูสวยงาม
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.info(`📩 Incoming Request: ${req.method} ${req.url}`, {
    Params: req.params,
    Query: req.query,
    Body: req.body,
  });
  next();
};

// ✅ Middleware สำหรับจับ Error และ Log พร้อมไฮไลท์จุดสำคัญ
export const errorLogger = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error("❌ Error Occurred", {
    Message: error.message,
    Stack: error.stack,
    URL: req.url,
    Method: req.method,
  });
  res.status(500).json({ error: "Internal Server Error" });
};
