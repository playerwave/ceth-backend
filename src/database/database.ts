import { createConnection } from "typeorm";
import dotenv from "dotenv";
import { Roles } from "../entity/Roles";
import { Users } from "../entity/Users";
import { Department } from "../entity/Department";
import { Grade } from "../entity/Grade";
import { EventCoop } from "../entity/EventCoop";
import { Faculty } from "../entity/Faculty";
import { Students } from "../entity/Students";
import { Teacher } from "../entity/Teacher";
import { Building } from "../entity/Building";
import { Room } from "../entity/Room";
import { Food } from "../entity/Food";
import { ActivityFood } from "../entity/ActivityFood";
import { QuestionType } from "../entity/QuestionType";
import { Question } from "../entity/Question";
import { Choice } from "../entity/Choice";
import { SetNumber } from "../entity/SetNumber";
import { Assessment } from "../entity/Assessment";
import { Answer } from "../entity/Answer";
import { Activity } from "../entity/Activity";
import { Join } from "../entity/Join";
import { ActivityDetail } from "../entity/ActivityDetail";
import { Certificate } from '../entity/Certificate'
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
        Roles,
        Users,
        Department,
        Grade,
        EventCoop,
        Faculty,
        Students,
        Teacher,
        Building,
        Room,
        Food,
        ActivityFood,
        QuestionType,
        Question,
        Choice,
        SetNumber,
        Assessment,
        Answer,
        Activity,
        Join,
        ActivityDetail,
        Certificate
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
