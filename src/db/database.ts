import {
  Connection,
  createConnection,
  getConnection,
  getConnectionManager,
} from "typeorm";
import dotenv from "dotenv";

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

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
import { Question } from "../entity/question.entity";
import { Choice } from "../entity/choice.entity";
import { SetNumber } from "../entity/setNumbers.entity";
import { Assessment } from "../entity/assessment.entity";
import { Answer } from "../entity/answer.entity";
import { Activity } from "../entity/activity.entity";
import { Join } from "../entity/join.entity";
import { ActivityDetail } from "../entity/activitydetail.entity";
import { Certificate } from "../entity/certificate.entity";
import { QRCode } from "../entity/qr-code.entity";

// ✅ Singleton Database Manager
class DatabaseManager {
  private static instance: DatabaseManager;
  private connection: Connection | null = null;
  private isClosing = false;
  private isInitializing = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async getConnection(): Promise<Connection> {
    // ✅ ถ้ามี connection อยู่แล้วและเชื่อมต่ออยู่
    if (this.connection && this.connection.isConnected) {
      return this.connection;
    }

    // ✅ ถ้ากำลัง initialize อยู่ ให้รอ
    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.connection && this.connection.isConnected) {
        return this.connection;
      }
    }

    // ✅ เริ่ม initialize
    this.isInitializing = true;

    try {
      const connectionManager = getConnectionManager();

      // ✅ ตรวจสอบว่ามี connection เดิมอยู่หรือไม่
      if (connectionManager.has("default")) {
        this.connection = connectionManager.get("default");
        if (this.connection.isConnected) {
          console.log("🔁 Reusing existing database connection");
          this.isInitializing = false;
          return this.connection;
        } else {
          // ✅ ถ้า connection หลุด ให้ reconnect
          console.log("🔄 Reconnecting to database...");
          await this.connection.connect();
          this.isInitializing = false;
          return this.connection;
        }
      }

      // ✅ สร้าง connection ใหม่
      console.log("🆕 Creating new database connection...");
      console.log("🔍 DB Config:", {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        database: process.env.DB_DATABASE,
        ssl: false
      });
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
          SetNumber,
          Assessment,
          Answer,
          Activity,
          Join,
          ActivityDetail,
          Certificate,
          QRCode,
        ],
        synchronize: true,
        logging: false, // ✅ ปิด logging เพื่อลด overhead
        // ✅ ลด connection pooling settings
        extra: {
          max: 3, // ✅ ลดจำนวน connection สูงสุด
          min: 1, // ✅ จำนวน connection ขั้นต่ำ
          idle: 60000, // ✅ เพิ่มเวลาที่ connection จะ idle ก่อนปิด (60 วินาที)
          acquire: 60000, // ✅ เวลาสูงสุดในการรอ connection (60 วินาที)
          evict: 60000, // ✅ เวลาที่จะตรวจสอบ connection ที่ idle (60 วินาที)
        },
        // ✅ เพิ่ม connection timeout
        connectTimeoutMS: 30000,
      });

      console.log("✅ Database connected successfully");
      this.isInitializing = false;
      return this.connection;
    } catch (error) {
      this.isInitializing = false;
      console.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล: ", error);

      // ✅ ลองปิด connection เก่าถ้ามี (เฉพาะเมื่อยังไม่ปิด)
      if (this.connection && this.connection.isConnected && !this.isClosing) {
        try {
          this.isClosing = true;
          await this.connection.close();
          console.log("🔒 Closed existing connection");
        } catch (closeError) {
          console.error("❌ Error closing connection:", closeError);
        } finally {
          this.isClosing = false;
        }
      }

      throw new Error("การเชื่อมต่อฐานข้อมูลล้มเหลว");
    }
  }

  // ✅ ฟังก์ชันปิด connection
  public async closeConnection(): Promise<void> {
    try {
      if (this.connection && this.connection.isConnected && !this.isClosing) {
        this.isClosing = true;
        await this.connection.close();
        this.connection = null;
        console.log("🔒 Database connection closed");
      }
    } catch (error) {
      console.error("❌ Error closing database connection:", error);
    } finally {
      this.isClosing = false;
    }
  }

  // ✅ ฟังก์ชันตรวจสอบ connection status
  public isConnected(): boolean {
    return this.connection !== null && this.connection.isConnected;
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
