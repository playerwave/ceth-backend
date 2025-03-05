import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entity/User";
import { Activity } from "../entity/Activity"; 

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres", // ✅ ใช้ PostgreSQL เป็นฐานข้อมูล
  host: process.env.HOST, // ✅ ที่อยู่ของฐานข้อมูล (อ่านจาก .env)
  port: Number(process.env.PG_PORT), // ✅ กำหนดพอร์ตจาก .env
  username: process.env.NAME, // ✅ ชื่อผู้ใช้ฐานข้อมูล
  password: process.env.PASSWORD, // ✅ รหัสผ่านฐานข้อมูล
  database: process.env.DATABASENAME, // ✅ ชื่อฐานข้อมูล
  synchronize: true, // ✅ สร้าง/อัปเดตโครงสร้างฐานข้อมูลอัตโนมัติ (ควรปิดใน production)
  logging: true, // ✅ เปิด logging ของ TypeORM
  entities: [User,Activity], // ✅ กำหนด entity ที่ต้องการให้ TypeORM ใช้งาน
});

// ✅ ฟังก์ชันเชื่อมต่อฐานข้อมูล
export const connectDatabase = async () => {
  try {
    await AppDataSource.initialize(); // ✅ เชื่อมต่อฐานข้อมูล
    console.log("✅ Database connected successfully!"); // ✅ แสดงข้อความเมื่อเชื่อมต่อสำเร็จ
  } catch (error) {
    console.error("❌ Error connecting to database:", error); // ❌ แสดง error ถ้าการเชื่อมต่อล้มเหลว
    process.exit(1); // ❌ ปิดโปรแกรมถ้าการเชื่อมต่อล้มเหลว
  }
};
