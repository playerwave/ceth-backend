import winston from "winston";
import morgan from "morgan";
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import chalk from "chalk"; // ✅ แบบนี้ถูกต้องสำหรับ chalk@4

// 🧱 ตรวจสอบและสร้าง logs/ directory
const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 🎨 ปรับสีข้อความ log แต่ละระดับด้วย chalk
const colorizeLevel = (level: string, text: string): string => {
  switch (level) {
    case "error":
      return chalk.red.bold(text);
    case "warn":
      return chalk.yellow.bold(text);
    case "info":
      return chalk.cyanBright(text);
    default:
      return text;
  }
};

// 🎨 กำหนดรูปแบบ log ให้อ่านง่าย
const logFormat = winston.format.printf(
  ({ timestamp, level, message, ...meta }) => {
    const emojiMap: Record<string, string> = {
      info: "📘",
      warn: "⚠️",
      error: "❌",
    };

    const icon = emojiMap[level] || "🔍";
    const title = colorizeLevel(
      level,
      `:: ${icon} ${level.toUpperCase()} :: ${message}`
    );

    let log = `\n${title}`;

    const details: string[] = [];

    if (meta.message) {
      details.push(chalk.redBright(`💥 Message: ${meta.message}`));
      delete meta.message;
    }

    if (meta.stack) {
      const formattedStack = String(meta.stack)
        .split("\n")
        .map((line) => "   " + chalk.gray(line))
        .join("\n");
      details.push(chalk.redBright(`🧩 Stack:\n${formattedStack}`));
      delete meta.stack;
    }

    if (Object.keys(meta).length) {
      const formattedMeta = JSON.stringify(meta, null, 2)
        .replace(/^{/, "")
        .replace(/}$/, "")
        .trim()
        .split("\n")
        .map((line) => "   " + chalk.white(line))
        .join("\n");
      details.push(chalk.white(`🧩 Meta:\n${formattedMeta}`));
    }

    if (details.length > 0) {
      log += `\n${details.join("\n")}`;
    }

    log += `\n${chalk.gray(
      "------------------------------------------------------------"
    )}`;

    return log;
  }
);

// 🛠️ สร้าง Logger instance
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize({ all: true }), // ⬅️ ใส่ all: true เพื่อให้ใช้กับทั้ง message และ meta
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDir, "app.log"),
      format: winston.format.json(),
    }),
  ],
});

export default logger;

// 🌐 Middleware: HTTP log ด้วย morgan
export const httpLogger = morgan("tiny", {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});

// 🛬 Middleware: Log request details
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info(`📥 Incoming Request: ${req.method} ${req.originalUrl}`, {
    Params: req.params,
    Query: req.query,
    Body: req.body,
  });
  next();
};

// 🐌 Middleware: เตือนถ้า request ช้าเกิน threshold
export const warnIfSlowRequest = (thresholdMs = 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (duration > thresholdMs) {
        logger.warn(
          `🐢 Slow Request: ${req.method} ${req.originalUrl} took ${duration}ms`
        );
      }
    });
    next();
  };
};

// 🚨 Middleware: Log error แบบปลอดภัย
export const errorLogger = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = err instanceof Error ? err : new Error("Unknown error");

  logger.error(`🚨 Unhandled Error in ${req.method} ${req.originalUrl}`, {
    message: error.message,
    stack: error.stack,
    URL: req.originalUrl,
    Method: req.method,
  });

  res.status(500).json({ error: "Internal Server Error" });
};
