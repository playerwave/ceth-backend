import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase, closeDatabase } from "./db/database";
import bodyParser from "body-parser";
import { httpLogger, requestLogger, errorLogger } from "./utils/logger";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import "./jobs/cron.job";
import { UsersService } from "./services/user.service";
import { getSessionConfig } from "./config/cookie.config";

// routes
import userRoute from "./routes/user.route";
import teacherActivityRoute from "./routes/Teacher/activity.route";
import teacherRoomRoute from "./routes/Teacher/room.route";
import teacherBuildingRoute from "./routes/Teacher/building.route";
import teacherRoute from "./routes/Teacher/teacher.route";
import teacherFoodRoute from "./routes/Teacher/food.route";
import teacherAssessmentRoute from "./routes/Teacher/assessment.route";
import teacherSetNumberRoute from "./routes/Teacher/setNumber.route";
import teacherQuestionRoute from "./routes/Teacher/question.route";
import teacherQRCodeRoute from "./routes/Teacher/qr-code.route";
import teacherStudentRoute from "./routes/Teacher/teacherStudent.route";
import teacherChoiceRoute from "./routes/Teacher/choice.route"
import teacherActivityReportRoute from "./routes/Teacher/activity-report.route";
import teacherUserManagementRoute from "./routes/Teacher/user-management.route";
import teacherUltraOptimizedUserManagementRoute from "./routes/Teacher/ultra-optimized-user-management.route";
import teacherEventCoopRoute from "./routes/Teacher/event-coop.route";
import teacherCertificateRoute from "./routes/Teacher/certificate.route";
import certificateTemplateRoute from "./routes/Teacher/certificate-template.route";

import studentActivityRoute from "./routes/Student/activity.route";
import studentAssessmentRoute from "./routes/Student/assessment.route";
import studentRoute from "./routes/Student/students.route";
import studentGradeRoute from "./routes/Student/grade.route";
import studentCertificateRoute from "./routes/Student/certificate.route";
import ocrRoute from "./routes/Student/orc.route";

import authRoute from "./routes/auth.route";
import roleRoute from "./routes/roles.route";
import departmentRoute from "./routes/department.route";
import facultyRoute from "./routes/faculty.route";
import activityVisitorRoute from "./routes/visitor/activity.route";
import emailRoute from "./routes/email.route";

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

// Debug: Log which env file is being used
console.log(`🔧 Loading environment from: ${envFile}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔧 DB_HOST: ${process.env.DB_HOST}`);

const app = express();

/* ------------ CORS (ก่อนทุกอย่าง) ------------ */
/**
 * ใช้ได้ 2 โหมด:
 * 1) ตั้ง CORS_ALLOWED_ORIGINS (comma-separated) เพื่ออนุญาต origin แบบระบุเอง
 *    - ใช้กับกรณี preview local ที่ต้องยิงไป VPS ตรง ๆ เช่น:
 *      CORS_ALLOWED_ORIGINS=http://localhost:4173,http://127.0.0.1:4173
 * 2) ถ้าไม่ได้ตั้งตัวแปรนี้และ NODE_ENV !== production → อนุญาต localhost ports สำหรับ dev
 * 3) ใน production ปกติ (หลัง Cloudflare Pages proxy) ไม่ต้องเปิด CORS เลย (same-origin)
 */
const envAllowed = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const shouldEnableCors =
  envAllowed.length > 0 ||
  process.env.NODE_ENV !== "production" ||
  true; // เปิด CORS เสมอเพื่อรองรับ Cloudflare Pages

if (shouldEnableCors) {
  const defaultDev = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    // Cloudflare Pages domains
    "https://cooperative-system-buu.pages.dev",
    "https://*.cooperative-system-buu.pages.dev",
  ];
  const allowList = envAllowed.length > 0 ? envAllowed : defaultDev;

  const corsMw = cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // Postman/mobile apps
      if (allowList.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true, // ✅ สำคัญมากสำหรับ cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
      "Accept",
      "Origin"
    ],
    exposedHeaders: [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
      "Set-Cookie"
    ],
  });

  app.use(corsMw);
  app.options("*", corsMw);
}

/* ------------ Passport / Session ------------ */
const usersService = new UsersService();
usersService.initializePassport();

app.use(cookieParser());

// อยู่หลัง proxy (Cloudflare) ให้ trust proxy
app.set("trust proxy", 1);

// session cookie: prod ต้อง Secure + SameSite=None
app.use(session(getSessionConfig()));

app.use(passport.initialize());
app.use(passport.session());

/* ------------ Body parsers ------------ */
// ✅ เพิ่ม JSON parser แบบ global เพื่อให้ทุก route ใช้ได้
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ เก็บ bodyParser.urlencoded เอาไว้เผื่อ route เก่าใช้
// ✅ แก้ไข: ไม่ parse body สำหรับ DELETE request
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    bodyParser.urlencoded({ limit: "10mb", extended: true })(req, res, next);
  } else if (req.method === "DELETE") {
    // ✅ Skip body parsing สำหรับ DELETE request
    console.log("🗑️ [BodyParser] Skipping body parsing for DELETE request:", req.url);
    next();
  } else {
    next();
  }
});

/* ------------ Basic route & logging ------------ */
app.get("/", (_req, res) => {
  res.send("Hello, World!");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use(httpLogger);
app.use(requestLogger);

/* ------------ API Routes ------------ */
// teacher
app.use("/api/teacher/user", userRoute);
app.use("/api/teacher/activity", teacherActivityRoute);
app.use("/api/teacher/room", teacherRoomRoute);
app.use("/api/teacher/building", teacherBuildingRoute);
app.use("/api/teacher", teacherRoute);
app.use("/api/teacher/food", teacherFoodRoute);
app.use("/api/teacher/assessment", teacherAssessmentRoute);
app.use("/api/teacher/setNumber", teacherSetNumberRoute);
app.use("/api/teacher/question", teacherQuestionRoute);
app.use("/api/teacher/qr-code", teacherQRCodeRoute);
app.use("/api/teacher", teacherStudentRoute);
app.use("/api/teacher/choice", teacherChoiceRoute);
app.use("/api/teacher/activity-report", teacherActivityReportRoute);
app.use("/api/teacher/user-management", teacherUserManagementRoute);
app.use("/api/teacher/ultra-optimized", teacherUltraOptimizedUserManagementRoute);
app.use("/api/teacher/event-coop", teacherEventCoopRoute);
app.use("/api/teacher/certificate", teacherCertificateRoute);
app.use("/api/teacher/certificate-template", certificateTemplateRoute);

// student
app.use("/api/student/activity", studentActivityRoute);
app.use("/api/student/assessment", studentAssessmentRoute);
app.use("/api/student", studentRoute);
app.use("/api/student/grade", studentGradeRoute);
app.use("/api/student/certificate", studentCertificateRoute);
app.use("/api/ocr", ocrRoute);

// auth / common
app.use("/api/auth", authRoute);
app.use("/api/role", roleRoute);
app.use("/api/department", departmentRoute);
app.use("/api/faculty", facultyRoute);
app.use("/api/visitor", activityVisitorRoute);
app.use("/api/email", emailRoute);

/* ------------ Fallback / Error ------------ */
app.use("*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

app.use(errorLogger);

/* ------------ Boot ------------ */
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  try {
    await closeDatabase();
    console.log("✅ Database connection closed");

    if (server) {
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
      setTimeout(() => {
        console.error("❌ Force shutdown due to timeout");
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ Error during graceful shutdown:", err);
    process.exit(1);
  }
};

let server: any = null;

const startServer = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await connectDatabase();
    console.log("✅ Database connected successfully");

    // ให้ default เป็น 5090 ให้ตรงกับ docker (8069:5090)
    const PORT = Number(process.env.PORT) || 5090;

    // listen ทุก interface ในคอนเทนเนอร์
    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
    });


    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1);
  }
};

startServer();

