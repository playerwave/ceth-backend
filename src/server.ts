import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./db/database";
import bodyParser from "body-parser";
import "reflect-metadata";
import { httpLogger, requestLogger, errorLogger } from "./utils/logger";
import { validationResult } from "express-validator";
import cookieParser from "cookie-parser";

//import authRoute
import authRoute from "./routes/auth.route";

//import admin routes
// import userRoute from "./routes/Test/user.route";
import adminActivityRoute from "./routes/Admin/activity.route";
import adminAssessmentRoute from "./routes/Admin/assessment.route";

//import student routes
import studentActivityRoute from "./routes/Student/activity.route";

dotenv.config();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// ใช้ CORS
app.use(
  cors({
    origin: "http://localhost:5173", // ระบุโดเมนที่อนุญาต
    credentials: true, // อนุญาตให้ใช้ credentials เช่น cookies
  })
);

// ตั้งค่า middleware สำหรับการแปลง request body เป็น JSON
app.use(cookieParser());

// สร้าง route พื้นฐาน
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use(httpLogger); // ใช้ HTTP Logger จาก Morgan
app.use(requestLogger); // Log รายละเอียด Request (Params, Query, Body)

/* Router(api) */

// api ของ role annonymus (usecase 6 ,7)
app.use("/api/auth", authRoute); //api authenticate login, logout, checkAuth บลาๆ

// api ของ role admin (usecase 8,9,10,11,12)
// app.use("/api/user", userRoute);
app.use("/api/admin/activity", adminActivityRoute);
app.use("/api/admin/assessment", adminAssessmentRoute);

//api ของ role student (usecase 1,2,3,4,5)
app.use("/api/student/activity", studentActivityRoute);

app.use(errorLogger); // ใช้ Error Logger ข้อความ Error ให้อ่านง่ายขึ้น

// เชื่อมต่อ database
connectDatabase()
  .then(() => {
    const PORT = process.env.PORT || 5090; // ใช้พอร์ต 5090
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database", error);
  });
