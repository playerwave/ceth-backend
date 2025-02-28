import { createConnection } from "typeorm";
import { User } from "../entity/User"; // ตัวอย่าง Entity
import dotenv from "dotenv";
import * as fs from "fs";
import path from "path";

dotenv.config();

// export const connectDatabase = async () => {
//   try {
//     const connection = await createConnection({
//       type: "postgres", // ใช้ PostgreSQL
//       host: process.env.HOST, // ที่อยู่ของ PostgreSQL container (เชื่อมต่อที่ localhost)
//       port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432, // พอร์ตที่ใช้สำหรับ PostgreSQL
//       username: process.env.NAME, // ชื่อผู้ใช้ที่ใช้ใน Docker Compose
//       password: process.env.PASSWORD, // รหัสผ่านที่ตั้งใน Docker Compose
//       database: process.env.DATABASENAME, // ชื่อฐานข้อมูลที่ตั้งใน Docker Compose
//       entities: [User], // กำหนด Entity ที่ใช้
//       synchronize: true, // สร้างตารางจาก Entity โดยอัตโนมัติ
//       logging: false, // เปิด log การเชื่อมต่อ
//     });
//     console.log("Database connected successfully");
//     return connection;
//   } catch (error) {
//     console.error("Error connecting to the database", error);
//     throw error;
//   }
// };

export const loadActivityData = () => {
  try {
    const activityData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "activities.json"), "utf-8")
    );
    console.log("Activity data loaded successfully");
    return activityData; // ส่งคืนข้อมูลกิจกรรมที่โหลด
  } catch (error) {
    console.error("Error reading activity data", error);
    throw new Error("Failed to load activity data.");
  }
};
