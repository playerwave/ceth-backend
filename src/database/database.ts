import { createConnection } from "typeorm";
import dotenv from "dotenv";
import { Department } from "../entity/Department";
import { EventCoop } from "../entity/EventCoop";
import { Grade } from "../entity/Grade";
import { Roles } from "../entity/Roles";
import { Users } from "../entity/Users";
import { Faculty } from "../entity/Faculty";
import { Teacher } from "../entity/Teacher";
import { Students } from "../entity/Students";

dotenv.config();

export const connectDatabase = async () => {
  try {
    const connection = await createConnection({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        Department,
        EventCoop,
        Grade,
        Roles,
        Faculty,
        Users,
        Students,
        Teacher,
      ],
      synchronize: true,
      logging: true,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    console.log("Database connected successfully");
    return connection;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล: ", error);
    throw new Error("การเชื่อมต่อฐานข้อมูลล้มเหลว");
  }
};
