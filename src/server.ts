import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./db/database";
import bodyParser from "body-parser";
import "reflect-metadata";
import { httpLogger, requestLogger, errorLogger } from "./middleware/logger";
import { validationResult } from "express-validator";

//import admin routes
// import userRoute from "./routes/Test/user.route";
import adminActivityRoute from "./routes/Admin/activity.route";
import adminAssessmentRoute from "./routes/Admin/assessment.route";

//import student routes
import studentActivityRoute from "./routes/Student/activity.route";

import userRoute from "./routes/TestCloud/user.route";
import eventCoopRoute from "./routes/TestCloud/eventCoop.route";
import certificateCoopRoute from "./routes/TestCloud/certificate.route";
import quetionRoute from "./routes/TestCloud/quetion.route";
import assessmentRoute from "./routes/TestCloud/assessment.route";
import activityRoute from "./routes/TestCloud/activity.route";
import activityAssessmentRoute from "./routes/TestCloud/activityAssessment.route";
import userActivityRoute from "./routes/TestCloud/userActivity.route";
import choiceRoute from "./routes/TestCloud/choice.route";
import userChoiceRoute from "./routes/TestCloud/userChoice.route";

dotenv.config();

const app = express();

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// ใช้ CORS
app.use(
  cors({
    origin: "http://localhost:5173", // ระบุโดเมนที่อนุญาต
    credentials: true, // อนุญาตให้ใช้ credentials เช่น cookies
  }),
);

// ตั้งค่า middleware สำหรับการแปลง request body เป็น JSON
app.use(express.json());

// สร้าง route พื้นฐาน
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use(httpLogger); // ใช้ HTTP Logger จาก Morgan
app.use(requestLogger); // Log รายละเอียด Request (Params, Query, Body)

const requestValidator = (req: Request, res: Response, next: NextFunction) => {
  try {
    next();
  } catch (error) {
    next(error);
  }
};

// ใช้เป็น Middleware ที่ถูกต้อง
app.use(requestValidator);

//api admin
// app.use("/api/user", userRoute);
app.use("/api/admin/activity", adminActivityRoute);
app.use("/api/admin/assessment", adminAssessmentRoute);

//api student
app.use("/api/student/activity", studentActivityRoute);

// ทดสอบดึงข้อมูลจาก cloud
app.use("/users", userRoute);
app.use("/eventCoop", eventCoopRoute);
app.use("/certificate", certificateCoopRoute);
app.use("/question", quetionRoute);
app.use("/assessment", assessmentRoute);
app.use("/activity", activityRoute);
app.use("/activityAssessment", activityAssessmentRoute);
app.use("/userActivity", userActivityRoute);
app.use("/choice", choiceRoute);
app.use("/userChoice", userChoiceRoute);

app.use(errorLogger); // ใช้ Error Logger

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
