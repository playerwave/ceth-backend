import { createConnection } from "typeorm";
import dotenv from "dotenv";

//import Entity
import { User } from "../entity/User";
import { Activity } from "../entity/Activity";
import { Assessment } from "../entity/Assessment";
import { UserActivity } from "../entity/UserActivity";

dotenv.config();

// ✅ ฟังก์ชันเชื่อมต่อฐานข้อมูล
export const connectDatabase = async () => {
  try {
    const connection = await createConnection({
      type: "postgres", // ใช้ PostgreSQL
      host: process.env.HOST, // ที่อยู่ของ PostgreSQL container (เชื่อมต่อที่ localhost)
      port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432, // พอร์ตที่ใช้สำหรับ PostgreSQL
      username: process.env.NAME, // ชื่อผู้ใช้ที่ใช้ใน Docker Compose
      password: process.env.PASSWORD, // รหัสผ่านที่ตั้งใน Docker Compose
      database: process.env.DATABASENAME, // ชื่อฐานข้อมูลที่ตั้งใน Docker Compose
      entities: [User, Activity, Assessment, UserActivity], // กำหนด Entity ที่ใช้
      synchronize: true, // สร้างตารางจาก Entity โดยอัตโนมัติ
      logging: false, // เปิด log การเชื่อมต่อ
    });

    console.log("✅ Database connected successfully");
    return connection;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล: ", error);
    throw new Error("การเชื่อมต่อฐานข้อมูลล้มเหลว");
  }
};
