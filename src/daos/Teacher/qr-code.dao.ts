import { DataSource } from "typeorm";
import { QRCode } from "../../entity/qr-code.entity";
import { Activity } from "../../entity/activity.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";
import { randomBytes } from "crypto";

export class QRCodeDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
  }

  private async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing QRCodeDao...");
      this.dataSource = await connectDatabase();
      console.log("✅ QRCodeDao initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize QRCodeDao:", error);
      this.logDbError("initialize", error);
      throw error;
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.dataSource?.isConnected) {
      console.log(
        "🔄 Database connection not established, attempting to initialize..."
      );
      try {
        await this.initialize();
      } catch (error) {
        throw new Error(`❌ Database connection is not established: ${error}`);
      }
    }
  }

  //--------------------- Generate QR Code Token -------------------------
  async generateQRCodeToken(activityId: number): Promise<{
    qrCodeUrl: string;
    token: string;
    expiresAt: Date;
  }> {
    console.log("🔐 DAO: Starting generateQRCodeToken for activity:", activityId);
    
    await this.checkConnection();
    console.log("🔐 DAO: Database connection checked");

    const queryRunner = this.dataSource!.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    console.log("🔐 DAO: Transaction started");

    try {
      // ตรวจสอบว่า activity มีอยู่จริง
      console.log("🔐 DAO: Checking if activity exists...");
      const activityResult = await queryRunner.query(
        `SELECT * FROM activity WHERE activity_id = $1`,
        [activityId]
      );

      console.log("🔐 DAO: Activity check result:", {
        found: activityResult.length > 0,
        activityId,
        activityName: activityResult[0]?.activity_name || "N/A"
      });

      if (activityResult.length === 0) {
        throw new Error("Activity not found");
      }

      // ยกเลิก token เก่าทั้งหมดของ activity นี้
      console.log("🔐 DAO: Revoking old tokens...");
      await this.revokeAllTokensForActivity(activityId);
      console.log("🔐 DAO: Old tokens revoked");

      // สร้าง token ใหม่
      console.log("🔐 DAO: Generating new token...");
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + 15 * 1000); // 15 วินาที
      console.log("🔐 DAO: Token generated:", { token: token.substring(0, 8) + "...", expiresAt });

      // บันทึก token ใหม่
      console.log("🔐 DAO: Inserting token into database...");
      const result = await queryRunner.query(
        `INSERT INTO qr_code (token, activity_id, expires_at, is_active, created_at) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [token, activityId, expiresAt, true, new Date()]
      );
      console.log("🔐 DAO: Token inserted successfully:", { qrCodeId: result[0]?.qr_code_id });

      // สร้าง QR Code URL สำหรับ QR Code generator
      console.log("🔐 DAO: Creating QR Code URL...");
      
      // กำหนด URL ตาม environment
      const getFrontendUrl = () => {
        console.log("🔍 [QR DAO] Environment check:", {
          NODE_ENV: process.env.NODE_ENV,
          FRONTEND_URL: process.env.FRONTEND_URL,
          DB_HOST: process.env.DB_HOST,
          isProduction: process.env.NODE_ENV === 'production'
        });
        
        // ตรวจสอบ environment variables
        if (process.env.FRONTEND_URL) {
          console.log("🔍 [QR DAO] Using FRONTEND_URL from env:", process.env.FRONTEND_URL);
          return process.env.FRONTEND_URL;
        }
        
        // ตรวจสอบ NODE_ENV
        if (process.env.NODE_ENV === 'production') {
          console.log("🔍 [QR DAO] Using production URL from NODE_ENV");
          return 'https://cooperative-system-buu.pages.dev';
        }
        
        // ตรวจสอบ hostname เพื่อ detect production
        const hostname = process.env.DB_HOST || '';
        if (hostname.includes('deploy') || hostname.includes('production') || hostname.includes('ceth-db-deploy')) {
          console.log("🔍 [QR DAO] Detected production by hostname, using production URL");
          return 'https://cooperative-system-buu.pages.dev';
        }
        
        // Development fallback
        console.log("🔍 [QR DAO] Using development URL");
        return 'http://localhost:5173';
      };
      
      const frontendUrl = getFrontendUrl();
      const scanUrl = `${frontendUrl}/qr-activity-checkinout-student/${activityId}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(scanUrl)}`;
      
      console.log("🔐 DAO: Environment info:", {
        NODE_ENV: process.env.NODE_ENV,
        FRONTEND_URL: process.env.FRONTEND_URL,
        frontendUrl,
        scanUrl
      });
      console.log("🔐 DAO: URLs created:", { scanUrl, qrCodeUrl: qrCodeUrl.substring(0, 50) + "..." });

      console.log("🔐 DAO: Generated QR Code token:", {
        activityId,
        token: token.substring(0, 8) + "...",
        expiresAt,
        scanUrl,
        qrCodeUrl: qrCodeUrl.substring(0, 50) + "..."
      });

      await queryRunner.commitTransaction();
      console.log("🔐 DAO: Transaction committed successfully");

      return {
        qrCodeUrl,
        token,
        expiresAt,
      };
    } catch (error) {
      console.error("❌ DAO: Error in generateQRCodeToken:", error);
      await queryRunner.rollbackTransaction();
      console.log("🔐 DAO: Transaction rolled back");
      this.logDbError("generateQRCodeToken", error);
      throw error;
    } finally {
      await queryRunner.release();
      console.log("🔐 DAO: Query runner released");
    }
  }
  //----------------------------------------------------------------

  //--------------------- Reset QR Code Token -------------------------
  async resetQRCodeToken(activityId: number): Promise<{
    qrCodeUrl: string;
    token: string;
    expiresAt: Date;
  }> {
    console.log("🔄 DAO: Starting resetQRCodeToken for activity:", activityId);
    
    await this.checkConnection();
    console.log("🔄 DAO: Database connection checked");

    const queryRunner = this.dataSource!.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    console.log("🔄 DAO: Transaction started");

    try {
      // ตรวจสอบว่า activity มีอยู่จริง
      console.log("🔄 DAO: Checking if activity exists...");
      const activityResult = await queryRunner.query(
        `SELECT * FROM activity WHERE activity_id = $1`,
        [activityId]
      );

      console.log("🔄 DAO: Activity check result:", {
        found: activityResult.length > 0,
        activityId,
        activityName: activityResult[0]?.activity_name || "N/A"
      });

      if (activityResult.length === 0) {
        throw new Error("Activity not found");
      }

      // ยกเลิก token เก่าทั้งหมดของ activity นี้
      console.log("🔄 DAO: Revoking old tokens...");
      await this.revokeAllTokensForActivity(activityId);
      console.log("🔄 DAO: Old tokens revoked");

      // สร้าง token ใหม่
      console.log("🔄 DAO: Generating new token...");
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + 15 * 1000); // 15 วินาที
      console.log("🔄 DAO: Token generated:", { token: token.substring(0, 8) + "...", expiresAt });

      // บันทึก token ใหม่
      console.log("🔄 DAO: Inserting token into database...");
      const result = await queryRunner.query(
        `INSERT INTO qr_code (token, activity_id, expires_at, is_active, created_at) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [token, activityId, expiresAt, true, new Date()]
      );
      console.log("🔄 DAO: Token inserted successfully:", { qrCodeId: result[0]?.qr_code_id });

      // สร้าง QR Code URL สำหรับ QR Code generator
      console.log("🔄 DAO: Creating QR Code URL...");
      
      // กำหนด URL ตาม environment
      const getFrontendUrl = () => {
        console.log("🔍 [QR DAO] Environment check:", {
          NODE_ENV: process.env.NODE_ENV,
          FRONTEND_URL: process.env.FRONTEND_URL,
          DB_HOST: process.env.DB_HOST,
          isProduction: process.env.NODE_ENV === 'production'
        });
        
        // ตรวจสอบ environment variables
        if (process.env.FRONTEND_URL) {
          console.log("🔍 [QR DAO] Using FRONTEND_URL from env:", process.env.FRONTEND_URL);
          return process.env.FRONTEND_URL;
        }
        
        // ตรวจสอบ NODE_ENV
        if (process.env.NODE_ENV === 'production') {
          console.log("🔍 [QR DAO] Using production URL from NODE_ENV");
          return 'https://cooperative-system-buu.pages.dev';
        }
        
        // ตรวจสอบ hostname เพื่อ detect production
        const hostname = process.env.DB_HOST || '';
        if (hostname.includes('deploy') || hostname.includes('production') || hostname.includes('ceth-db-deploy')) {
          console.log("🔍 [QR DAO] Detected production by hostname, using production URL");
          return 'https://cooperative-system-buu.pages.dev';
        }
        
        // Development fallback
        console.log("🔍 [QR DAO] Using development URL");
        return 'http://localhost:5173';
      };
      
      const frontendUrl = getFrontendUrl();
      const scanUrl = `${frontendUrl}/qr-activity-checkinout-student/${activityId}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(scanUrl)}`;
      
      console.log("🔄 DAO: Environment info:", {
        NODE_ENV: process.env.NODE_ENV,
        FRONTEND_URL: process.env.FRONTEND_URL,
        frontendUrl,
        scanUrl
      });
      console.log("🔄 DAO: URLs created:", { scanUrl, qrCodeUrl: qrCodeUrl.substring(0, 50) + "..." });

      console.log("🔄 DAO: Reset QR Code token:", {
        activityId,
        token: token.substring(0, 8) + "...",
        expiresAt,
        scanUrl,
        qrCodeUrl: qrCodeUrl.substring(0, 50) + "..."
      });

      await queryRunner.commitTransaction();
      console.log("🔄 DAO: Transaction committed successfully");

      return {
        qrCodeUrl,
        token,
        expiresAt,
      };
    } catch (error) {
      console.error("❌ DAO: Error in resetQRCodeToken:", error);
      await queryRunner.rollbackTransaction();
      console.log("🔄 DAO: Transaction rolled back");
      this.logDbError("resetQRCodeToken", error);
      throw error;
    } finally {
      await queryRunner.release();
      console.log("🔄 DAO: Query runner released");
    }
  }
  //----------------------------------------------------------------

  //--------------------- Validate Token -------------------------
  async validateToken(token: string): Promise<boolean> {
    await this.checkConnection();

    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM qr_code WHERE token = $1 AND is_active = $2`,
        [token, true]
      );

      if (result.length === 0) {
        console.log("❌ Token not found or inactive:", token);
        return false;
      }

      const qrCode = result[0];

      // ตรวจสอบว่า token หมดอายุหรือไม่
      if (new Date() > qrCode.expires_at) {
        console.log("❌ Token expired:", token);
        // ยกเลิก token ที่หมดอายุ
        await this.revokeToken(token);
        return false;
      }

      console.log("✅ Token valid:", token);
      return true;
    } catch (error) {
      this.logDbError("validateToken", error);
      return false;
    }
  }
  //----------------------------------------------------------------

  //--------------------- Scan QR Code -------------------------
  async scanQRCode(token: string, studentId: number): Promise<{
    success: boolean;
    message: string;
    activityId: number;
  }> {
    await this.checkConnection();

    try {
      console.log("📱 DAO: Scanning QR Code with token:", token);
      console.log("📱 DAO: Student ID:", studentId);

      // ตรวจสอบว่า token ถูกต้องและยังไม่หมดอายุ
      const isValid = await this.validateToken(token);
      if (!isValid) {
        console.log("❌ DAO: Invalid or expired token:", token);
        return {
          success: false,
          message: "QR Code ไม่ถูกต้องหรือหมดอายุแล้ว",
          activityId: 0
        };
      }

      // ดึงข้อมูล QR Code
      const qrCodeResult = await this.dataSource!.query(
        `SELECT * FROM qr_code WHERE token = $1 AND is_active = $2`,
        [token, true]
      );

      if (qrCodeResult.length === 0) {
        console.log("❌ DAO: QR Code not found:", token);
        return {
          success: false,
          message: "ไม่พบ QR Code นี้",
          activityId: 0
        };
      }

      const qrCode = qrCodeResult[0];
      const activityId = qrCode.activity_id;

      // ตรวจสอบว่า activity ยังเปิดรับสมัครอยู่หรือไม่
      const activityResult = await this.dataSource!.query(
        `SELECT * FROM activity WHERE activity_id = $1`,
        [activityId]
      );

      if (activityResult.length === 0) {
        console.log("❌ DAO: Activity not found:", activityId);
        return {
          success: false,
          message: "ไม่พบกิจกรรมนี้",
          activityId: 0
        };
      }

      const activity = activityResult[0];
      
      // ตรวจสอบว่า activity state อนุญาตให้ลงทะเบียนได้
      const allowedStates = ["Start Activity", "End Activity", "Open Register"];
      if (!allowedStates.includes(activity.activity_state)) {
        console.log("❌ DAO: Activity state not allowed for registration:", activity.activity_state);
        return {
          success: false,
          message: "กิจกรรมนี้ยังไม่เปิดให้ลงทะเบียน",
          activityId: activityId
        };
      }

      // ตรวจสอบว่านักศึกษาลงทะเบียนแล้วหรือไม่
      const existingRegistration = await this.dataSource!.query(
        `SELECT * FROM activity_student WHERE activity_id = $1 AND student_id = $2`,
        [activityId, studentId]
      );

      if (existingRegistration.length > 0) {
        console.log("❌ DAO: Student already registered:", { activityId, studentId });
        return {
          success: false,
          message: "คุณได้ลงทะเบียนกิจกรรมนี้แล้ว",
          activityId: activityId
        };
      }

      // ลงทะเบียนนักศึกษาเข้ากิจกรรม
      await this.dataSource!.query(
        `INSERT INTO activity_student (activity_id, student_id, created_at) VALUES ($1, $2, $3)`,
        [activityId, studentId, new Date()]
      );

      console.log("✅ DAO: Student registered successfully:", { activityId, studentId });

      return {
        success: true,
        message: "ลงทะเบียนเข้าร่วมกิจกรรมสำเร็จ",
        activityId: activityId
      };
    } catch (error) {
      console.error("❌ DAO: Error scanning QR Code:", error);
      this.logDbError("scanQRCode", error);
      return {
        success: false,
        message: "เกิดข้อผิดพลาดในการลงทะเบียน",
        activityId: 0
      };
    }
  }
  //----------------------------------------------------------------

  //--------------------- Get QR Code Status -------------------------
  async getQRCodeStatus(activityId: number): Promise<{
    isActive: boolean;
    currentToken: string;
    expiresAt: Date;
  }> {
    await this.checkConnection();

    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM qr_code 
         WHERE activity_id = $1 AND is_active = $2 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [activityId, true]
      );

      if (result.length === 0) {
        return {
          isActive: false,
          currentToken: "",
          expiresAt: new Date(),
        };
      }

      const qrCode = result[0];

      // ตรวจสอบว่า token หมดอายุหรือไม่
      const isExpired = new Date() > qrCode.expires_at;
      if (isExpired) {
        await this.revokeToken(qrCode.token);
        return {
          isActive: false,
          currentToken: "",
          expiresAt: new Date(),
        };
      }

      return {
        isActive: true,
        currentToken: qrCode.token,
        expiresAt: qrCode.expires_at,
      };
    } catch (error) {
      this.logDbError("getQRCodeStatus", error);
      throw error;
    }
  }
  //----------------------------------------------------------------

  //--------------------- Revoke Token -------------------------
  async revokeToken(token: string): Promise<void> {
    await this.checkConnection();

    try {
      await this.dataSource!.query(
        `UPDATE qr_code SET is_active = $1 WHERE token = $2`,
        [false, token]
      );
      console.log("🗑️ Token revoked:", token);
    } catch (error) {
      this.logDbError("revokeToken", error);
      throw error;
    }
  }
  //----------------------------------------------------------------

  //--------------------- Revoke All Tokens for Activity -------------------------
  async revokeAllTokensForActivity(activityId: number): Promise<void> {
    await this.checkConnection();

    try {
      await this.dataSource!.query(
        `UPDATE qr_code SET is_active = $1 WHERE activity_id = $2`,
        [false, activityId]
      );
      console.log("🗑️ All tokens revoked for activity:", activityId);
    } catch (error) {
      this.logDbError("revokeAllTokensForActivity", error);
      throw error;
    }
  }
  //----------------------------------------------------------------

  //--------------------- Cleanup Expired Tokens -------------------------
  async cleanupExpiredTokens(): Promise<void> {
    await this.checkConnection();

    try {
      const expiredTokens = await this.dataSource!.query(
        `SELECT * FROM qr_code 
         WHERE expires_at <= $1 AND is_active = $2`,
        [new Date(), true]
      );

      for (const token of expiredTokens) {
        await this.revokeToken(token.token);
      }

      console.log("🧹 Cleaned up expired tokens:", expiredTokens.length);
    } catch (error) {
      this.logDbError("cleanupExpiredTokens", error);
    }
  }
  //----------------------------------------------------------------

  //--------------------- Generate Token -------------------------
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
  //----------------------------------------------------------------
}
