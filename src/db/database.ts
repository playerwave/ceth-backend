import { createConnection } from "typeorm";
import { User } from "../entity/User"; // ตัวอย่าง Entity
import dotenv from "dotenv";

dotenv.config();

export const connectDatabase = async () => {
  try {
    const connection = await createConnection({
      type: "postgres", // ใช้ PostgreSQL
      host: process.env.HOST, // ที่อยู่ของ PostgreSQL container (เชื่อมต่อที่ localhost)
      port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432, // พอร์ตที่ใช้สำหรับ PostgreSQL
      username: process.env.NAME, // ชื่อผู้ใช้ที่ใช้ใน Docker Compose
      password: process.env.PASSWORD, // รหัสผ่านที่ตั้งใน Docker Compose
      database: process.env.DATABASENAME, // ชื่อฐานข้อมูลที่ตั้งใน Docker Compose
      entities: [User], // กำหนด Entity ที่ใช้
      synchronize: true, // สร้างตารางจาก Entity โดยอัตโนมัติ
      logging: false, // เปิด log การเชื่อมต่อ
    });
    console.log("Database connected successfully");
    return connection;
  } catch (error) {
    console.error("Error connecting to the database", error);
    throw error;
  }
};
