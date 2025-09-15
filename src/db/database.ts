import { createConnection, Connection } from "typeorm";
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
import { Question } from "../entity/Assessment/question.entity";
import { Choice } from "../entity/Assessment/choice.entity";
import { Answer } from "../entity/Assessment/answer.entity";
import { Assessment } from "../entity/Assessment/assessment.entity";
import { Certificate } from "../entity/certificate.entity";
import { Activity } from "../entity/activity.entity";
import { ActivityDetail } from "../entity/activitydetail.entity";
import { Join } from "../entity/join.entity";
import { QRCode } from "../entity/qr-code.entity";
import { SetNumber } from "../entity/Assessment/setNumbers.entity";
// Import version entities
import { AssessmentVersion } from "../entity/Assessment/versioning assessment/assessment-version.entity";
import { SetNumberVersion } from "../entity/Assessment/versioning assessment/setNumber-version.entity";
import { QuestionVersion } from "../entity/Assessment/versioning assessment/question-version.entity";
import { ChoiceVersion } from "../entity/Assessment/versioning assessment/choice-version.entity";

// ✅ Singleton Database Manager
class DatabaseManager {
  private static instance: DatabaseManager;
  private connection: Connection | null = null;
  private isClosing = false;
  private isInitializing = false;

  private constructor() { }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async getConnection(): Promise<Connection> {
    // ✅ ถ้ามี connection อยู่แล้วและเชื่อมต่ออยู่
    if (this.connection && this.connection.isConnected) {
      console.log("🔗 Using existing database connection");
      return this.connection;
    }

    // ✅ ถ้ากำลัง initialize อยู่ ให้รอ
    if (this.isInitializing) {
      console.log("⏳ Waiting for database initialization...");
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // ✅ ถ้ามี connection อยู่แล้วแต่ไม่ได้เชื่อมต่อ
    if (this.connection) {
      try {
        if (this.connection.isConnected) {
          console.log("🔁 Reusing existing database connection");
          this.isInitializing = false;
          return this.connection;
        } else {
          console.log("🔄 Reconnecting to existing database...");
          await this.connection.connect();
          this.isInitializing = false;
          return this.connection;
        }
      } catch (error) {
        console.log("❌ Failed to reuse connection, creating new one...");
        this.connection = null;
      }
    }

    // ✅ สร้าง connection ใหม่
    this.isInitializing = true;
    try {
      console.log("🚀 Creating new database connection...");

      // ✅ ตรวจสอบ environment variables
      if (!process.env.DB_HOST || !process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_DATABASE) {
        throw new Error("Missing database environment variables");
      }

      this.connection = await createConnection({
        name: "default",
        type: "postgres",
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: process.env.DB_HOST?.includes('render.com') ? {
          rejectUnauthorized: false, // สำหรับ Render PostgreSQL
        } : false, // ไม่ใช้ SSL สำหรับ local Docker
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
          Question,
          Choice,
          Answer,
          Assessment,
          Certificate,
          Activity,
          ActivityDetail,
          Join,
          QRCode,
          SetNumber,
          AssessmentVersion,
          SetNumberVersion,
          QuestionVersion,
          ChoiceVersion
        ],
        synchronize: true,  // ⚠️ ปิด synchronize เพื่อป้องกันข้อมูลหาย
        // ✅ เพิ่ม connection pooling settings
        extra: {
          max: 20,        // ✅ เพิ่มจาก 3 เป็น 20
          min: 5,         // ✅ เพิ่มจาก 1 เป็น 5
          idle: 600000,   // ✅ เพิ่มจาก 60 วินาที เป็น 10 นาที
          acquire: 60000, // ✅ เพิ่มจาก 60 วินาที เป็น 1 นาที
          evict: 300000,  // ✅ เพิ่มจาก 60 วินาที เป็น 5 นาที
        },
        // ✅ เพิ่ม timeout settings
        connectTimeoutMS: 60000,    // 1 นาที
        // ✅ เพิ่ม logging
        logging: ['error', 'warn'],  // ลบ schema และ migration ออก
        dropSchema: false,
        migrationsRun: false,  // ปิด migrationsRun
        logger: "advanced-console",
      });

      console.log("✅ Database connected successfully");
      this.isInitializing = false;
      return this.connection;
    } catch (error) {
      this.isInitializing = false;
      console.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล: ", error);

      // ✅ ลองปิด connection เก่าถ้ามี (เฉพาะเมื่อยังไม่ปิด)
      if (this.connection && !this.isClosing) {
        try {
          await this.connection.close();
        } catch (closeError) {
          console.error("❌ Error closing connection:", closeError);
        }
        this.connection = null;
      }

      throw new Error("การเชื่อมต่อฐานข้อมูลล้มเหลว");
    }
  }

  // ✅ ฟังก์ชันปิด connection
  public async closeConnection(): Promise<void> {
    if (this.isClosing) {
      return;
    }

    this.isClosing = true;
    try {
      if (this.connection && this.connection.isConnected) {
        await this.connection.close();
        console.log("✅ Database connection closed");
      }
    } catch (error) {
      console.error("❌ Error closing database connection:", error);
    } finally {
      this.connection = null;
      this.isClosing = false;
    }
  }

  // ✅ ฟังก์ชันตรวจสอบสถานะ connection
  public isConnected(): boolean {
    return this.connection !== null && this.connection.isConnected;
  }

  // ✅ ฟังก์ชันตรวจสอบ connection health
  public async checkConnectionHealth(): Promise<boolean> {
    try {
      if (!this.connection || !this.connection.isConnected) {
        return false;
      }

      // ทดสอบ query ง่ายๆ
      await this.connection.query('SELECT 1');
      return true;
    } catch (error) {
      console.error("❌ Connection health check failed:", error);
      return false;
    }
  }
}

// ✅ Export singleton instance
const dbManager = DatabaseManager.getInstance();

export const connectDatabase = async (): Promise<Connection> => {
  return dbManager.getConnection();
};

export const closeDatabase = async (): Promise<void> => {
  return dbManager.closeConnection();
};

export const isDatabaseConnected = (): boolean => {
  return dbManager.isConnected();
};
