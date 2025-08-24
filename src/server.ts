// import "reflect-metadata";
// import express, { Request, Response, NextFunction } from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { connectDatabase, closeDatabase } from "./db/database";
// import bodyParser from "body-parser";
// import { httpLogger, requestLogger, errorLogger } from "./utils/logger";
// // import { validationResult } from "express-validator";
// import cookieParser from "cookie-parser";
// import session from "express-session";
// import passport from "passport";
// import "./jobs/cron.job";
// import { UsersService } from "./services/user.service";

// //import authRoute
// // import authRoute from "./routes/auth.route";

// //import teacher routes
// import userRoute from "./routes/user.route";
// import teacherActivityRoute from "./routes/Teacher/activity.route";
// import teacherRoomRoute from "./routes/Teacher/room.route";
// import teacherBuildingRoute from "./routes/Teacher/building.route";
// import teacherRoute from "./routes/Teacher/teacher.route";
// import teacherFoodRoute from "./routes/Teacher/food.route";
// import teacherAssessmentRoute from "./routes/Teacher/assessment.route";
// import teacherSetNumberRoute from "./routes/Teacher/setNumber.route";
// import teacherQuestionRoute from './routes/Teacher/question.route'

// // import adminActivityRoute from "./routes/Admin/activity.route";
// // import adminAssessmentRoute from "./routes/Admin/assessment.route";

// //import student routes
// import studentActivityRoute from "./routes/Student/activity.route";
// import studentRoute from "./routes/Student/students.route";
// import studentGradeRoute from "./routes/Student/grade.route";
// import ocrRoute from "./routes/Student/orc.route";

// //import visitor routes
// import visitorRoute from "./routes/user.route";
// import authRoute from "./routes/auth.route";

// // import role
// import roleRoute from "./routes/roles.route";

// //import department routes
// import departmentRoute from "./routes/department.route";

// //import faculty routes
// import facultyRoute from "./routes/faculty.route";

// //import student routes
// // import studentActivityRoute from "./routes/Student/activity.route";

// import activityVisitorRoute from "./routes/visitor/activity.route";
// import emailRoute from "./routes/email.route";


// dotenv.config();

// const app = express();

// // app.use(express.json({ limit: "10mb" }));
// // app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// // ✅ เรียก initializePassport
// const usersService = new UsersService();
// usersService.initializePassport(); // 👈 ต้องมี


// app.use(cookieParser());
// // ✅ ใช้ session-based auth

// app.set('trust proxy', 1);
// app.use(
//   session({
//     secret: "secret-key",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       secure: process.env.NODE_ENV === "production", // true บน Pages/HTTPS
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//       // ไม่ต้องตั้ง domain ให้ปล่อยตาม host ที่ตอบ
//     },
//   })
// );
// app.use(passport.initialize());
// app.use(passport.session());

// // 👇 ใช้เฉพาะ method ที่ต้องมี body เท่านั้น
// app.use((req, res, next) => {
//   if (["POST", "PUT", "PATCH"].includes(req.method)) {
//     express.json({ limit: "10mb" })(req, res, next);
//   } else {
//     next();
//   }
// });

// // 👇 ใช้ urlencoded เฉพาะ method ที่จำเป็น
// app.use((req, res, next) => {
//   if (["POST", "PUT", "PATCH"].includes(req.method)) {
//     bodyParser.urlencoded({ limit: "10mb", extended: true })(req, res, next);
//   } else {
//     next();
//   }
// });

// // ใช้ CORS
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // ✅ อนุญาต requests ที่ไม่มี origin (เช่น mobile apps, Postman)
//       if (!origin) return callback(null, true);
      
//       const allowedOrigins = [
//         "http://localhost:5173", 
//         "http://localhost:3000",
//         "http://localhost:4173", // Vite preview port
//         "http://127.0.0.1:5173",
//         "http://127.0.0.1:3000", 
//         "http://127.0.0.1:4173",
//         "http://vps.theapds.org:8069",
//         "https://vps.theapds.org",
//         "http://45.144.164.136",
//         "https://45.144.164.136",
//         "https://cooperative-system-buu.pages.dev",
//         "https://09f37be8.cooperative-system-buu.pages.dev",
//       ];
      
//       // ✅ อนุญาต Cloudflare Pages domains
//       if (origin.includes('cooperative-system-buu.pages.dev')) {
//         return callback(null, true);
//       }
      
//       if (allowedOrigins.indexOf(origin) !== -1) {
//         callback(null, true);
//       } else {
//         console.log(`🚫 CORS blocked origin: ${origin}`);
//         callback(new Error('Not allowed by CORS'));
//       }
//     },
//     credentials: true, // อนุญาตให้ใช้ credentials เช่น cookies
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
//     exposedHeaders: ["Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"],
//   })
// );

// // ✅ เพิ่ม CORS preflight handler ใช้ configuration เดียวกัน
// app.options('*', cors({
//   origin: function (origin, callback) {
//     // ✅ อนุญาต requests ที่ไม่มี origin (เช่น mobile apps, Postman)
//     if (!origin) return callback(null, true);
    
//     const allowedOrigins = [
//       "http://localhost:5173", 
//       "http://localhost:3000",
//       "http://localhost:4173", // Vite preview port
//       "http://127.0.0.1:5173",
//       "http://127.0.0.1:3000", 
//       "http://127.0.0.1:4173",
//       "http://vps.theapds.org:8069",
//       "https://vps.theapds.org",
//       "http://45.144.164.136",
//       "https://45.144.164.136",
//       "https://cooperative-system-buu.pages.dev",
//       "https://09f37be8.cooperative-system-buu.pages.dev",
//     ];
    
//     // ✅ อนุญาต Cloudflare Pages domains
//     if (origin.includes('cooperative-system-buu.pages.dev')) {
//       return callback(null, true);
//     }
    
//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       console.log(`🚫 CORS preflight blocked origin: ${origin}`);
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
//   exposedHeaders: ["Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"],
// }));

// // สร้าง route พื้นฐาน
// app.get("/", (req, res) => {
//   res.send("Hello, World!");
// });

// app.use(httpLogger); // ใช้ HTTP Logger จาก Morgan
// app.use(requestLogger); // Log รายละเอียด Request (Params, Query, Body)

// /* Router(api) */

// // api ของ role annonymus (usecase 6 ,7)
// // app.use("/api/auth", authRoute); //api authenticate login, logout, checkAuth บลาๆ

// // api ของ role admin (usecase 8,9,10,11,12)
// app.use("/api/teacher/user", userRoute);
// app.use("/api/teacher/activity", teacherActivityRoute);
// app.use("/api/teacher/room", teacherRoomRoute);
// app.use("/api/teacher/building", teacherBuildingRoute);
// app.use("/api/teacher", teacherRoute);
// app.use("/api/teacher/food", teacherFoodRoute);
// app.use("/api/teacher/assessment", teacherAssessmentRoute);
// app.use("/api/teacher/setNumber", teacherSetNumberRoute);
// app.use("/api/teacher/question", teacherQuestionRoute);

// //api ของ role student (usecase 1,2,3,4,5)
// app.use("/api/student/activity", studentActivityRoute);
// app.use("/api/student", studentRoute);
// app.use("/api/student/grade", studentGradeRoute);
// app.use("/api/ocr", ocrRoute);

// // api ของ auth (login, logout, me)
// app.use("/api/auth", authRoute);

// app.use("/api/role", roleRoute);
// app.use("/api/department", departmentRoute);
// app.use("/api/faculty", facultyRoute);
// app.use("/api/visitor", activityVisitorRoute);
// app.use("/api/email", emailRoute);

// // ✅ เพิ่ม fallback route เพื่อป้องกัน 404
// app.use("*", (req, res) => {
//   res.status(404).json({ 
//     error: "API endpoint not found", 
//     path: req.originalUrl,
//     method: req.method 
//   });
// });

// app.use(errorLogger); // ใช้ Error Logger ข้อความ Error ให้อ่านง่ายขึ้น

// // ✅ ฟังก์ชัน graceful shutdown
// const gracefulShutdown = async (signal: string) => {
//   console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

//   try {
//     // ✅ ปิด database connection
//     await closeDatabase();
//     console.log("✅ Database connection closed");

//     // ✅ ปิด server
//     if (server) {
//       server.close(() => {
//         console.log("✅ Server closed");
//         process.exit(0);
//       });

//       // ✅ Force close หลังจาก 10 วินาที
//       setTimeout(() => {
//         console.error(
//           "❌ Could not close connections in time, forcefully shutting down"
//         );
//         process.exit(1);
//       }, 10000);
//     } else {
//       process.exit(0);
//     }
//   } catch (error) {
//     console.error("❌ Error during graceful shutdown:", error);
//     // ✅ ไม่ต้องรอ ให้ปิดทันที
//     process.exit(1);
//   }
// };

// // เชื่อมต่อ database และเริ่ม server
// let server: any = null;

// const startServer = async () => {
//   try {
//     console.log("🔄 Connecting to database...");
//     await connectDatabase();
//     console.log("✅ Database connected successfully");

//     const PORT = process.env.PORT || 443; // หรือใช้ Cloudflare Tunnel
//     server = app.listen(PORT, () => {
//       console.log(`🚀 Server is running on https://vps.theapds.org:${PORT}`);

//     });

//     // ✅ ตั้งค่า graceful shutdown
//     process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
//     process.on("SIGINT", () => gracefulShutdown("SIGINT"));

//     // ✅ จัดการ uncaught exceptions
//     process.on("uncaughtException", (error) => {
//       console.error("❌ Uncaught Exception:", error);
//       gracefulShutdown("uncaughtException");
//     });

//     // ✅ จัดการ unhandled promise rejections
//     process.on("unhandledRejection", (reason, promise) => {
//       console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
//       gracefulShutdown("unhandledRejection");
//     });
//   } catch (error) {
//     console.error("❌ Failed to connect to the database:", error);
//     process.exit(1); // ออกจากโปรแกรมถ้าเชื่อมต่อ database ไม่ได้
//   }
// };

// startServer();

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

import studentActivityRoute from "./routes/Student/activity.route";
import studentRoute from "./routes/Student/students.route";
import studentGradeRoute from "./routes/Student/grade.route";
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
  envAllowed.length > 0 || process.env.NODE_ENV !== "production";

if (shouldEnableCors) {
  const defaultDev = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ];
  const allowList = envAllowed.length > 0 ? envAllowed : defaultDev;

  const corsMw = cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // Postman/mobile apps
      if (allowList.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"],
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
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      // ไม่ตั้ง domain → ให้ผูกกับ host ที่ตอบอัตโนมัติ
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ------------ Body parsers (เฉพาะ method ที่ต้องใช้) ------------ */
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    express.json({ limit: "10mb" })(req, res, next);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    bodyParser.urlencoded({ limit: "10mb", extended: true })(req, res, next);
  } else {
    next();
  }
});

/* ------------ Basic route & logging ------------ */
app.get("/", (_req, res) => {
  res.send("Hello, World!");
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

// student
app.use("/api/student/activity", studentActivityRoute);
app.use("/api/student", studentRoute);
app.use("/api/student/grade", studentGradeRoute);
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

