import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./db/database";
import bodyParser from "body-parser";
import "reflect-metadata";
import { requestLogger, errorLogger } from "./middleware/logger";

//import routes
import userRoute from "./routes/Test/user.route";
import activityRoute from "./routes/Admin/activity.route";

dotenv.config();

const app = express();

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// ใช้ CORS
app.use(
  cors({
    origin: "http://localhost:5173", // ระบุโดเมนที่อนุญาต
    credentials: true, // อนุญาตให้ใช้ credentials เช่น cookies
  })
);

// ตั้งค่า middleware สำหรับการแปลง request body เป็น JSON
app.use(express.json());

// สร้าง route พื้นฐาน
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

//api
app.use("/api/user", userRoute);
app.use("/api/activity", activityRoute);


app.use(requestLogger); // ใช้ Middleware สำหรับ Log Request
app.use(errorLogger); // ใช้ Middleware จับ Error และ Log

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
