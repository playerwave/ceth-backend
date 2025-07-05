// import { createConnection } from "typeorm";
// import dotenv from "dotenv";

// //import entity
// import { Roles } from "../entity/roles.entity";
// import { Users } from "../entity/users.entity";
// import { Department } from "../entity/department.entity";
// import { Grade } from "../entity/grade.entity";
// import { EventCoop } from "../entity/eventcoop.entity";
// import { Faculty } from "../entity/faculty.entity";
// import { Students } from "../entity/students.entity";
// import { Teacher } from "../entity/teacher.entity";
// import { Building } from "../entity/building.entity";
// import { Room } from "../entity/room.entity";
// import { Food } from "../entity/food.entity";
// import { ActivityFood } from "../entity/activity.food.entity";
// import { QuestionType } from "../entity/questiontype.entity";
// import { Question } from "../entity/question.entity";
// import { Choice } from "../entity/choice.entity";
// import { SetNumber } from "../entity/setNumbers.entity";
// import { Assessment } from "../entity/assessment.entity";
// import { Answer } from "../entity/answer.entity";
// import { Activity } from "../entity/activity.entity";
// import { Join } from "../entity/join.entity";
// import { ActivityDetail } from "../entity/activitydetail.entity";
// import { Certificate } from "../entity/certificate.entity";

// dotenv.config();

// export const connectDatabase = async () => {
//   try {
//     const connection = await createConnection({
//       type: "postgres",
//       host: process.env.DB_HOST,
//       port: parseInt(process.env.DB_PORT || "5432"),
//       username: process.env.DB_USERNAME,
//       password: process.env.DB_PASSWORD,
//       database: process.env.DB_DATABASE,
//       entities: [
//         Roles,
//         Users,
//         Department,
//         Grade,
//         EventCoop,
//         Faculty,
//         Students,
//         Teacher,
//         Building,
//         Room,
//         Food,
//         ActivityFood,
//         QuestionType,
//         Question,
//         Choice,
//         SetNumber,
//         Assessment,
//         Answer,
//         Activity,
//         Join,
//         ActivityDetail,
//         Certificate
//       ],
//       synchronize: false,
//       logging: true,
//       ssl: {
//         rejectUnauthorized: false,
//       },
//     });
//     console.log("Database connected successfully");
//     return connection;
//   } catch (error) {
//     console.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล: ", error);
//     throw new Error("การเชื่อมต่อฐานข้อมูลล้มเหลว");
//   }
// };

import { Connection, createConnection, getConnection } from "typeorm";
import dotenv from "dotenv";
dotenv.config();

//import entity
import { Roles } from "../entity/roles.entity";
import { Users } from "../entity/users.entity";
import { Department } from "../entity/department.entity";
import { Grade } from "../entity/grade.entity";
import { EventCoop } from "../entity/eventcoop.entity";
import { Faculty } from "../entity/faculty.entity";
import { Students } from "../entity/students.entity";
import { Teacher } from "../entity/teacher.entity";
import { Building } from "../entity/building.entity";
import { Room } from "../entity/room.entity";
import { Food } from "../entity/food.entity";
import { ActivityFood } from "../entity/activity.food.entity";
import { QuestionType } from "../entity/questiontype.entity";
import { Question } from "../entity/question.entity";
import { Choice } from "../entity/choice.entity";
import { SetNumber } from "../entity/setNumbers.entity";
import { Assessment } from "../entity/assessment.entity";
import { Answer } from "../entity/answer.entity";
import { Activity } from "../entity/activity.entity";
import { Join } from "../entity/join.entity";
import { ActivityDetail } from "../entity/activitydetail.entity";
import { Certificate } from "../entity/certificate.entity";

let connection: Connection | null = null;

export const connectDatabase = async (): Promise<Connection> => {
  try {
    if (connection && connection.isConnected) {
      console.log("🔁 Reusing existing database connection");
      return connection;
    }

    try {
      // ลองใช้ getConnection ถ้ามีอยู่แล้ว
      connection = getConnection("default");
      if (!connection.isConnected) await connection.connect();
    } catch (e) {
      // ถ้าไม่มี connection เดิม → สร้างใหม่
      connection = await createConnection({
        name: "default",
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
          Certificate,
        ],
        synchronize: false,
        logging: true,
        ssl: { rejectUnauthorized: false },
      });
      console.log("✅ Database connected successfully");
    }

    return connection;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล: ", error);
    throw new Error("การเชื่อมต่อฐานข้อมูลล้มเหลว");
  }
};
