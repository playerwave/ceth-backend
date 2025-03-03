import { createConnection } from "typeorm";
import { User } from "../entity/User"; // ตรวจสอบให้แน่ใจว่า Entity นี้มีอยู่จริง
import dotenv from "dotenv";

dotenv.config();

export const connectDatabase = async () => {
  try {
    const connection = await createConnection({
      type: "postgres",
      host: process.env.HOST,
      port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
      username: process.env.NAME,
      password: process.env.PASSWORD,
      database: process.env.DATABASENAME,
      entities: [User], // ตรวจสอบ Entity ที่ใช้งานจริง
      synchronize: true,
      logging: false, // เปิด log ดูว่า error ตรงไหน
    });

    console.log("✅ Database connected successfully");
    return connection;
  } catch (error) {
    console.error("❌ Error connecting to the database", error);
    throw error;
  }
};
