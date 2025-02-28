import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// import { connectDatabase } from "./db/database";
import "reflect-metadata";

//import routes
// import userRoute from "./routes/Test/user.route";

dotenv.config();

const app = express();

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

//Test api
// app.use("/api/user", userRoute);

// เชื่อมต่อ database
// connectDatabase()
//   .then(() => {
//     const PORT = process.env.PORT || 5090; // ใช้พอร์ต 5090
//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.error("Failed to connect to the database", error);
//   });

//   const PORT = process.env.PORT || 5090; // ใช้พอร์ต 5090
//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);
//     });

    const PORT = process.env.PORT || 5090; // ใช้พอร์ต 5090
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
