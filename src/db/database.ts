import { createConnection } from "typeorm";
// import { Activity } from "../entity/Activity";
import dotenv from "dotenv";

dotenv.config();

export const connectDatabase = async () => {
  try {
    const connection = await createConnection({
      type: "postgres",
      host: process.env.HOST,
      port: parseInt(process.env.PG_PORT || '5432'),
      username: process.env.NAME,
      password: process.env.PASSWORD,
      database: process.env.DATABASENAME,
      entities: [],
      synchronize: false,
      logging: true,  // เปิด log การเชื่อมต่อเพื่อดูข้อความ error
    });
    console.log("Database connected successfully");
    return connection;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล: ", error);
    throw new Error("การเชื่อมต่อฐานข้อมูลล้มเหลว");
  }
};

