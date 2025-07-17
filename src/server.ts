import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./db/database";
import bodyParser from "body-parser";
import "reflect-metadata";
import { httpLogger, requestLogger, errorLogger } from "./utils/logger";
// import { validationResult } from "express-validator";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";

import { UsersService } from "./services/user.service";

//import authRoute
// import authRoute from "./routes/auth.route";

//import teacher routes
import userRoute from "./routes/user.route";
import teacherActivityRoute from "./routes/Teacher/activity.route";
import teacherRoomRoute from "./routes/Teacher/room.route";
import teacherBuildingRoute from "./routes/Teacher/building.route";
import teacherRoute from "./routes/Teacher/teacher.route";
import teacherFoodRoute from "./routes/Teacher/food.route";
import teacherAssessmentRoute from "./routes/Teacher/assessment.route";
import teacherSetNumberRoute from "./routes/Teacher/setNumber.route";
// import adminActivityRoute from "./routes/Admin/activity.route";
// import adminAssessmentRoute from "./routes/Admin/assessment.route";

//import student routes
import studentRoute from "./routes/Student/students.route";
import studentGradeRoute from "./routes/Student/grade.route";

//import visitor routes
import visitorRoute from "./routes/user.route";
import authRoute from "./routes/auth.route";

// import role
import roleRoute from "./routes/roles.route";

//import department routes
import departmentRoute from "./routes/department.route";

//import faculty routes
import facultyRoute from "./routes/faculty.route";

//import student routes
// import studentActivityRoute from "./routes/Student/activity.route";

dotenv.config();

const app = express();

// app.use(express.json({ limit: "10mb" }));
// app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// ✅ เรียก initializePassport
const usersService = new UsersService();
usersService.initializePassport(); // 👈 ต้องมี

// ✅ ใช้ session-based auth
// app.use(
//   session({
//     secret: "secret-key",
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: false, sameSite: "lax" },
//   })
// );
// app.use(passport.initialize());
// app.use(passport.session());

// 👇 ใช้เฉพาะ method ที่ต้องมี body เท่านั้น
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    express.json({ limit: "10mb" })(req, res, next);
  } else {
    next();
  }
});

// 👇 ใช้ urlencoded เฉพาะ method ที่จำเป็น
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    bodyParser.urlencoded({ limit: "10mb", extended: true })(req, res, next);
  } else {
    next();
  }
});

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
// app.use("/api/auth", authRoute); //api authenticate login, logout, checkAuth บลาๆ

// api ของ role admin (usecase 8,9,10,11,12)
app.use("/api/teacher/user", userRoute);
app.use("/api/teacher/activity", teacherActivityRoute);
app.use("/api/teacher/room", teacherRoomRoute);
app.use("/api/teacher/building", teacherBuildingRoute);
app.use("/api/teacher", teacherRoute);
app.use("/api/teacher/food", teacherFoodRoute);
app.use("/api/teacher/assessment", teacherAssessmentRoute);
app.use("/api/teacher/setNumber", teacherSetNumberRoute);

//api ของ role student (usecase 1,2,3,4,5)
// app.use("/api/student/activity");
app.use("/api/student", studentRoute);
app.use("/api/student/grade", studentGradeRoute);

// api ของ visitor
app.use("/api/auth", authRoute);

app.use("/api/role", roleRoute);
app.use("/api/department", departmentRoute);
app.use("/api/faculty", facultyRoute);

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
