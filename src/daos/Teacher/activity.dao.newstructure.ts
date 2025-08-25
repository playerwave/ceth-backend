import { DataSource } from "typeorm";
import { Activity } from "../../entity/activity.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";
import { sendCourseStartEmail, sendOpenRegisterEmail, sendEmailToStudentsByRiskStatus } from "../../controllers/email.controller";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { toUTCString, toThaiString, isTimeReached } from "../../utils/timeUtils";

// ✨ ติดตั้ง dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);


export type TransitionResult = {
  notStartToSpecial: number;
  notStartToOpen: number;
  notStartToStartActivity: number; // เพิ่ม transition ใหม่
  specialToOpen: number;
  openToClose: number;
  closeToStart: number;
  startToEnd: number;
  endToStartAssess: number;
  startAssessToEnd: number;
  updatedIds: {
    notStartToSpecial: number[];
    notStartToOpen: number[];
    notStartToStartActivity: number[]; // เพิ่ม transition ใหม่
    specialToOpen: number[];
    openToClose: number[];
    closeToStart: number[];
    startToEnd: number[];
    endToStartAssess: number[];
    startAssessToEnd: number[];
  };
};

export class ActivityDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    // ไม่เรียก initialize() ทันที เพื่อให้ test สามารถ mock ได้
    // this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing TeacherActivityDao...");
      this.dataSource = await connectDatabase();
      console.log("✅ TeacherActivityDao initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize TeacherActivityDao:", error);
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



  private sanitizeDate(input: unknown): string | null {
    // ✅ ถ้าเป็น null หรือ empty string ให้ return null
    if (input === null || input === undefined || input === "") {
      return null;
    }

    if (input instanceof Date) {
      // ✅ สำหรับ Date object ให้ใช้ UTC time components เพื่อไม่ให้ shift timezone
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return `${input.getUTCFullYear()}-${pad(input.getUTCMonth() + 1)}-${pad(input.getUTCDate())} ${pad(input.getUTCHours())}:${pad(input.getUTCMinutes())}:${pad(input.getUTCSeconds())}`;
    }

    if (typeof input === "string" && input.trim() !== "") {
      const trimmed = input.trim();

      // ✅ เอา timezone ออก (Z หรือ +07:00 ฯลฯ) เพื่อไม่ให้ Postgres shift เวลา
      // ตัวอย่าง: 2025-08-24T09:00:00.000Z -> 2025-08-24 09:00:00
      // หรือ 2025-08-24T09:00:00+07:00 -> 2025-08-24 09:00:00
      const noTz = trimmed
        .replace(/Z$/i, "")
        .replace(/[\+\-]\d{2}:?\d{2}$/i, "");

      // รองรับทั้งรูปแบบมี T และมี space
      const parts = noTz.replace("T", " ");
      const match = parts.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?$/);
      if (match) {
        // คืนแบบ 'YYYY-MM-DD HH:mm:ss' โดยตรงจาก string ไม่แปลง timezone
        return `${match[1]} ${match[2]}`;
      }

      return null;
    }

    // ✅ ถ้าไม่มีข้อมูล ให้ return null
    return null;
  }

  // public async createActivityDao(
  //   data: Partial<Activity>,
  //   foodIds: number[] = []
  // ): Promise<Activity> {
  //   this.checkConnection();

  //   const queryRunner = this.dataSource!.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     // ✅ Log ข้อมูลก่อนบันทึกลง Database
  //     console.log("🔍 === CREATE ACTIVITY - DATA BEFORE SAVE ===");
  //     console.log(
  //       "📅 special_start_register_date:",
  //       data.special_start_register_date
  //     );
  //     console.log("📅 start_register_date:", data.start_register_date);
  //     console.log("📅 end_register_date:", data.end_register_date);
  //     console.log("📅 start_activity_date:", data.start_activity_date);
  //     console.log("📅 end_activity_date:", data.end_activity_date);
  //     console.log("📅 start_assessment:", data.start_assessment);
  //     console.log("📅 end_assessment:", data.end_assessment);
  //     console.log("⏰ recieve_hours:", data.recieve_hours);
  //     console.log("🏢 room_id:", data.room_id);
  //     console.log("📊 assessment_id:", data.assessment_id);
  //     console.log("🔍 === END LOG ===");

  //     // Insert Activity
  //     const result = await queryRunner.query(
  //       `
  //       INSERT INTO Activity (
  //         activity_name, presenter_company_name, type, description,
  //         seat, recieve_hours, event_format, create_activity_date,
  //         special_start_register_date, start_register_date, end_register_date,
  //         start_activity_date, end_activity_date, image_url, activity_status,
  //         activity_state, status, last_update_activity_date, url, room_id,
  //         assessment_id, start_assessment, end_assessment
  //       ) VALUES (
  //         $1, $2, $3, $4, $5, $6, $7, $8,
  //         $9, $10, $11, $12, $13, $14, $15, $16,
  //         $17, $18, $19, $20, $21, $22, $23, $24
  //       ) RETURNING *
  //       `,
  //       [
  //         data.activity_name || "ไม่ระบุ",
  //         data.presenter_company_name || "ไม่ระบุ",
  //         data.type || "Soft",
  //         data.description || "ไม่ระบุ",
  //         data.seat ?? 0,
  //         data.recieve_hours ?? 0,
  //         data.event_format || "Online",
  //         new Date(),
  //         data.special_start_register_date instanceof Date
  //           ? this.formatDateToLocalString(data.special_start_register_date)
  //           : data.special_start_register_date || new Date(),
  //         data.start_register_date instanceof Date
  //           ? this.formatDateToLocalString(data.start_register_date)
  //           : data.start_register_date || new Date(),
  //         data.end_register_date instanceof Date
  //           ? this.formatDateToLocalString(data.end_register_date)
  //           : data.end_register_date || new Date(),
  //         data.start_activity_date instanceof Date
  //           ? this.formatDateToLocalString(data.start_activity_date)
  //           : data.start_activity_date || new Date(),
  //         data.end_activity_date instanceof Date
  //           ? this.formatDateToLocalString(data.end_activity_date)
  //           : data.end_activity_date || new Date(),
  //         data.image_url || "ไม่ระบุ",
  //         data.activity_status || "Private",
  //         data.activity_state || "Not Start",
  //         data.status || "Active",
  //         new Date(),
  //         data.url || "ไม่ระบุ",
  //         data.room_id ?? null,
  //         data.assessment_id ?? null,
  //         data.start_assessment instanceof Date
  //           ? this.formatDateToLocalString(data.start_assessment)
  //           : data.start_assessment || new Date(),
  //         data.end_assessment instanceof Date
  //           ? this.formatDateToLocalString(data.end_assessment)
  //           : data.end_assessment || new Date(),
  //       ]
  //     );

  //     // ✅ Log ข้อมูลที่จะบันทึกลง Database
  //     console.log("🔍 === CREATE ACTIVITY - VALUES TO SAVE ===");
  //     console.log(
  //       "📅 special_start_register_date (formatted):",
  //       result[0]?.special_start_register_date
  //     );
  //     console.log(
  //       "📅 start_register_date (formatted):",
  //       result[0]?.start_register_date
  //     );
  //     console.log(
  //       "📅 end_register_date (formatted):",
  //       result[0]?.end_register_date
  //     );
  //     console.log(
  //       "📅 start_activity_date (formatted):",
  //       result[0]?.start_activity_date
  //     );
  //     console.log(
  //       "📅 end_activity_date (formatted):",
  //       result[0]?.end_activity_date
  //     );
  //     console.log("⏰ recieve_hours:", result[0]?.recieve_hours);
  //     console.log("🏢 room_id:", result[0]?.room_id);
  //     console.log("📊 assessment_id:", result[0]?.assessment_id);
  //     console.log("🔍 === END LOG ===");

  //     const newActivity: Activity = result[0];

  //     // Insert ActivityFood
  //     if (foodIds.length > 0) {
  //       const values = foodIds.map(
  //         (foodId) => `(${newActivity.activity_id}, ${foodId})`
  //       );
  //       const insertFoodSQL = `
  //   INSERT INTO activity_food (activity_id, food_id)
  //   VALUES ${values.join(", ")}
  // `;
  //       await queryRunner.query(insertFoodSQL);
  //     }

  //     await queryRunner.commitTransaction();
  //     return newActivity;
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     this.logDbError("createActivityDao", error);
  //     throw new Error("❌ Failed to create activity with food");
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  public async createActivityDao(
    data: Partial<Activity>,
    foodIds: number[] = []
  ): Promise<Activity> {
    await this.checkConnection();

    const queryRunner = this.dataSource!.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 🔍 Logging for debug
      console.log("🔍 === CREATE ACTIVITY - DATA BEFORE SAVE ===");
      console.log("📅 start_activity_date:", data.start_activity_date);
      console.log("📅 end_activity_date:", data.end_activity_date);
      console.log("⏰ recieve_hours:", data.recieve_hours);
      console.log("🏢 room_id:", data.room_id);
      console.log("📊 assessment_id:", data.assessment_id);

      // 🛡️ Logging sanitized dates
      console.log("🛡️ Final sanitized dates:", {
        start_register_date: this.sanitizeDate(data.start_register_date),
        end_register_date: this.sanitizeDate(data.end_register_date),
        start_activity_date: this.sanitizeDate(data.start_activity_date),
        end_activity_date: this.sanitizeDate(data.end_activity_date),
        start_assessment: this.sanitizeDate(data.start_assessment),
        end_assessment: this.sanitizeDate(data.end_assessment),
      });

      const result = await queryRunner.query(
        `
        INSERT INTO activity (
          activity_name, presenter_company_name, type, description,
          seat, recieve_hours, event_format, create_activity_date,
          special_start_register_date,
          start_register_date, end_register_date, start_activity_date, end_activity_date,
          start_assessment, end_assessment,
          image_url, activity_status, activity_state, status, url, room_id, assessment_id,
          last_update_activity_date
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9,
          $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23
        ) RETURNING *
        `,
        [
          data.activity_name || "ไม่ระบุ",
          data.presenter_company_name || "ไม่ระบุ",
          data.type || "Soft",
          data.description || "ไม่ระบุ",
          data.seat ?? 0,
          data.recieve_hours ?? 0,
          data.event_format || "Online",
          new Date(), // create_activity_date
          this.sanitizeDate(data.special_start_register_date) || null, // 🟩 เพิ่มตรงนี้
          this.sanitizeDate(data.start_register_date) || null,
          this.sanitizeDate(data.end_register_date) || null,
          this.sanitizeDate(data.start_activity_date) || null,
          this.sanitizeDate(data.end_activity_date) || null,
          this.sanitizeDate(data.start_assessment) || null, // 🟩 เพิ่ม start_assessment
          this.sanitizeDate(data.end_assessment) || null, // 🟩 เพิ่ม end_assessment
          data.image_url || "ไม่ระบุ",
          data.activity_status || "Private",
          data.activity_state || "Not Start",
          data.status || "Active",
          data.url || "ไม่ระบุ",
          data.room_id ?? null,
          data.assessment_id ?? null,
          new Date(),
        ]
      );

      const newActivity: Activity = result[0];

      // ✅ เพิ่ม ActivityFood หากมี
      if (foodIds.length > 0) {
        // ✅ กรอง foodIds ที่ถูกต้อง (ไม่ใช่ -1 หรือ 0)
        const validFoodIds = foodIds.filter((foodId) => foodId > 0);

        if (validFoodIds.length > 0) {
          const values = validFoodIds
            .map((foodId) => `(${newActivity.activity_id}, ${foodId})`)
            .join(", ");
          await queryRunner.query(
            `INSERT INTO activity_food (activity_id, food_id) VALUES ${values}`
          );
          console.log("✅ Foods added successfully to new activity");
        } else {
          console.log("🍽️ No valid food IDs to add for new activity");
        }
      }

      await queryRunner.commitTransaction();
      return newActivity;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logDbError("createActivityDao", error);
      throw new Error("❌ Failed to create activity with food");
    } finally {
      await queryRunner.release();
    }
  }

  public async getActivityByHistory(): Promise<Activity[]> {
    await this.checkConnection();
    try {
      const sql = `SELECT * FROM activity WHERE (((event_format = 'Online' OR event_format = 'Onsite') AND activity_state = 'End Assessment') OR (event_format = 'Course' AND activity_state = 'End Activity')) ORDER BY activity_id ASC`
      const result = await this.dataSource?.query(sql);
      return result
    } catch (error) {
      this.logDbError("getActivityByHistory", error);
      throw new Error("❌ Failed to update activity");
    }
  }

  public async getSearch(text: string): Promise<Activity[]> {
    await this.checkConnection();
    try {
      const Text1 = text
      const Text2 = `%${text}%`
      const sql = `SELECT *, GREATEST(similarity(activity_name, $1), similarity(presenter_company_name, $1), similarity(type::text, $1)) AS relevance FROM activity WHERE activity_name ILIKE $2 OR presenter_company_name ILIKE $2 OR type::text ILIKE $2 ORDER BY relevance DESC`
      const result = await this.dataSource?.query(sql, [Text1, Text2]);
      return result;
    } catch (error) {
      this.logDbError("getSearch", error);
      throw new Error("❌ Failed to Search getSearch");
    }
  }

  public async getActivityByID(activity_id: number): Promise<Activity[]> {
    await this.checkConnection();
    try {
      const sql = `SELECT * FROM activity WHERE activity_id = $1`;
      const result = await this.dataSource?.query(sql, [activity_id]);
      return result;
    } catch (error) {
      this.logDbError("getActivityByID", error);
      throw new Error("❌ Failed to update activity");
    }
  }

  public async getAllActivitiesDao(): Promise<Activity[]> {
    await this.checkConnection();

    // ✅ ใช้ raw query เพื่อดึง registered_count
    const activities = await this.dataSource!.query(
      `
        SELECT 
          *,
          COALESCE(registered_count, 0) as registered_count
        FROM activity 
        WHERE status = 'Active'
        ORDER BY create_activity_date DESC
      `
    );

    return activities;
  }

  public async updateActivityDao(
    activity_id: number,
    data: Partial<Activity>,
    foodIds: number[] = []
  ): Promise<Activity> {
    await this.checkConnection();

    const queryRunner = this.dataSource!.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ✅ Log ข้อมูลก่อนบันทึกลง Database
      console.log("🔍 === UPDATE ACTIVITY - DATA BEFORE SAVE ===");
      console.log(
        "📅 special_start_register_date:",
        data.special_start_register_date
      );
      console.log("📅 start_register_date:", data.start_register_date);
      console.log("📅 end_register_date:", data.end_register_date);
      console.log("📅 start_activity_date:", data.start_activity_date);
      console.log("📅 end_activity_date:", data.end_activity_date);
      console.log("📅 start_assessment:", data.start_assessment);
      console.log("📅 end_assessment:", data.end_assessment);
      console.log("⏰ recieve_hours:", data.recieve_hours);
      console.log("🏢 room_id:", data.room_id);
      console.log("📊 assessment_id:", data.assessment_id);
      console.log("🔍 === END LOG ===");

      // ✅ อัปเดตข้อมูลกิจกรรม
      const updateFields = [
        "activity_name",
        "presenter_company_name",
        "type",
        "description",
        "seat",
        "recieve_hours",
        "event_format",
        "special_start_register_date",
        "start_register_date",
        "end_register_date",
        "start_activity_date",
        "end_activity_date",
        "start_assessment", // ✅ เพิ่ม start_assessment
        "end_assessment", // ✅ เพิ่ม end_assessment
        "image_url",
        "activity_status",
        "activity_state",
        "status",
        "last_update_activity_date",
        "url",
        "assessment_id",
        "room_id",
      ];

      const setClause = updateFields
        .map((field, index) => `${field} = $${index + 1}`)
        .join(", ");

      const values = updateFields.map((field) => {
        const value = (data as any)[field];

        // ✅ จัดการ seat field ให้เป็น 0 แทน null
        if (
          field === "seat" &&
          (value === null || value === undefined || isNaN(value))
        ) {
          return 0;
        }

        // ✅ จัดการ assessment_id และ room_id ให้เป็น null แทน NaN
        if (
          (field === "assessment_id" || field === "room_id") &&
          (value === null || value === undefined || isNaN(value))
        ) {
          return null;
        }

        // ✅ จัดการ date fields ให้เขียนแบบไม่มี timezone เพื่อเลี่ยง +7 ชม.
        if (field.includes("_date") || field.includes("_assessment")) {
          // ✅ ถ้าเป็น string ที่มี timezone ให้เอา timezone ออก
          if (typeof value === "string" && value.trim() !== "") {
            const trimmed = value.trim();
            // เอา timezone ออก (Z หรือ +07:00 ฯลฯ)
            const noTz = trimmed
              .replace(/Z$/i, "")
              .replace(/[\+\-]\d{2}:?\d{2}$/i, "");

            // รองรับทั้งรูปแบบมี T และมี space
            const parts = noTz.replace("T", " ");
            const match = parts.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?$/);
            if (match) {
              return `${match[1]} ${match[2]}`;
            }
          }
          return this.sanitizeDate(value);
        }

        return value ?? null;
      });

      // ✅ Log ข้อมูลที่จะบันทึกลง Database
      console.log("🔍 === UPDATE ACTIVITY - VALUES TO SAVE ===");
      console.log("📅 special_start_register_date (formatted):", values[7]);
      console.log("📅 start_register_date (formatted):", values[8]);
      console.log("📅 end_register_date (formatted):", values[9]);
      console.log("📅 start_activity_date (formatted):", values[10]);
      console.log("📅 end_activity_date (formatted):", values[11]);
      console.log("📅 start_assessment (formatted):", values[12]);
      console.log("📅 end_assessment (formatted):", values[13]);
      console.log("⏰ recieve_hours:", values[5]);
      console.log("🏢 room_id:", values[21]);
      console.log("📊 assessment_id:", values[20]);
      console.log("🔍 === END LOG ===");

      await queryRunner.query(
        `UPDATE activity SET ${setClause} WHERE activity_id = $${updateFields.length + 1
        }`,
        [...values, activity_id]
      );

      // ✅ ลบข้อมูลอาหารเดิม (ใช้ CASCADE หรือลบแบบปลอดภัย)
      // ตรวจสอบว่ามี activity_detail ที่เกี่ยวข้องหรือไม่
      const activityDetailCount = await queryRunner.query(
        `SELECT COUNT(*) as count FROM activity_detail WHERE activity_id = $1`,
        [activity_id]
      );

      if (activityDetailCount[0].count > 0) {
        console.log(`⚠️ Found ${activityDetailCount[0].count} activity_detail records for activity ${activity_id}`);
        console.log("⚠️ Skipping food update to preserve student enrollment data");
      } else {
        // ✅ ถ้าไม่มี activity_detail สามารถลบ activity_food ได้อย่างปลอดภัย
        await queryRunner.query(
          `DELETE FROM activity_food WHERE activity_id = $1`,
          [activity_id]
        );
        console.log("✅ Old foods deleted successfully");
      }

      // ✅ เพิ่มข้อมูลอาหารใหม่ (เฉพาะเมื่อไม่มี activity_detail)
      if (activityDetailCount[0].count === 0 && foodIds.length > 0) {
        // ✅ กรอง foodIds ที่ถูกต้อง (ไม่ใช่ -1 หรือ 0)
        const validFoodIds = foodIds.filter((foodId) => foodId > 0);

        if (validFoodIds.length > 0) {
          console.log("🍽️ Adding foods to activity:", {
            activity_id,
            validFoodIds,
          });
          const values = validFoodIds
            .map((foodId) => `(${activity_id}, ${foodId})`)
            .join(", ");
          const insertSQL = `INSERT INTO activity_food (activity_id, food_id) VALUES ${values}`;
          console.log("🍽️ Insert SQL:", insertSQL);
          await queryRunner.query(insertSQL);
          console.log("✅ Foods added successfully");
        } else {
          console.log("🍽️ No valid food IDs to add for activity:", activity_id);
        }
      } else if (activityDetailCount[0].count > 0) {
        console.log("🍽️ Skipping food update - activity has enrolled students");
      } else {
        console.log("🍽️ No foods to add for activity:", activity_id);
      }

      await queryRunner.commitTransaction();

      // ✅ ดึงข้อมูลกิจกรรมล่าสุดกลับมา
      const updated = await this.findById(activity_id);
      if (!updated) throw new Error("ไม่พบกิจกรรมหลังอัปเดต");

      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logDbError("updateActivityDao", error);

      // ✅ จัดการ error เฉพาะเจาะจง
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("foreign key constraint")) {
        throw new Error("❌ ไม่สามารถอัปเดตอาหารได้เนื่องจากมีนักเรียนลงทะเบียนแล้ว กรุณาลบการลงทะเบียนก่อน");
      }

      throw new Error("❌ Failed to update activity");
    } finally {
      await queryRunner.release();
    }
  }

  public async updateActyivityByStatus(
    activity_id: number,
    activity_status: string
  ): Promise<Activity[]> {
    await this.checkConnection();
    try {
      const sql = `UPDATE activity SET activity_status = $1 WHERE activity_id = $2;`;
      const result = await this.dataSource?.query(sql, [
        activity_status,
        activity_id,
      ]);
      return result;
    } catch (error) {
      this.logDbError("updateActyivityByStatus", error);
      throw new Error("❌ Failed to update activity");
    }
  }

  public async findById(id: number): Promise<Activity | null> {
    await this.checkConnection();

    // ✅ ดึงข้อมูลด้วยรูปแบบเวลาเป็น string ไม่ทำให้ timezone ขยับ
    const rows: any[] = await this.dataSource!.query(
      `
        SELECT 
          activity_id,
          activity_name,
          presenter_company_name,
          type,
          description,
          seat,
          recieve_hours,
          event_format,
          to_char(create_activity_date, 'YYYY-MM-DD"T"HH24:MI:SS.000"Z"') as create_activity_date,
          to_char(special_start_register_date, 'YYYY-MM-DD"T"HH24:MI:SS.000"Z"') as special_start_register_date,
          to_char(start_register_date, 'YYYY-MM-DD"T"HH24:MI:SS.000"Z"') as start_register_date,
          to_char(end_register_date, 'YYYY-MM-DD"T"HH24:MI:SS.000"Z"') as end_register_date,
          to_char(start_activity_date, 'YYYY-MM-DD"T"HH24:MI:SS.000"Z"') as start_activity_date,
          to_char(end_activity_date, 'YYYY-MM-DD"T"HH24:MI:SS.000"Z"') as end_activity_date,
          to_char(start_assessment, 'YYYY-MM-DD"T"HH24:MI:SS.000"Z"') as start_assessment,
          to_char(end_assessment, 'YYYY-MM-DD"T"HH24:MI:SS.000"Z"') as end_assessment,
          image_url,
          activity_status,
          activity_state,
          status,
          to_char(last_update_activity_date, 'YYYY-MM-DD"T"HH24:MI:SS.000"Z"') as last_update_activity_date,
          url,
          room_id,
          assessment_id,
          COALESCE(registered_count, 0) as registered_count
        FROM activity
        WHERE activity_id = $1
      `,
      [id]
    );

    const row = rows?.[0];
    if (!row) return null;

    // เติม field ที่ frontend คาดหวัง
    (row as any).activityFood = (row as any).activityFood ?? [];

    return row as unknown as Activity;
  }

  // อัปเดตข้อมูลกิจกรรม (ใช้สำหรับ soft delete)
  public async save(activity: Activity): Promise<Activity> {
    await this.checkConnection();

    return this.dataSource!.getRepository(Activity).save(activity);
  }

  // ลบกิจกรรม (ใช้สำหรับ hard delete)
  public async delete(id: number): Promise<void> {
    await this.checkConnection();

    await this.dataSource!.getRepository(Activity).delete({ activity_id: id });
  }

  public async advanceStatesOnce(freezeNow?: Date): Promise<TransitionResult> {
    await this.checkConnection();

    // ✅ Debug: ตรวจสอบข้อมูลใน database
    const debugQuery = `SELECT activity_id, activity_name, activity_state, status, event_format FROM activity WHERE status = 'Active' LIMIT 5`;
    const debugResult = await this.dataSource!.query(debugQuery);
    console.log(`🔍 [advanceStatesOnce] Current activities in DB:`, debugResult);

    // ✅ Debug: ตรวจสอบข้อมูลเวลาของกิจกรรม ID 1
    const debugTimeQuery = `
      SELECT 
        activity_id,
        activity_name,
        activity_state,
        end_register_date,
        start_activity_date,
        to_char(end_register_date, 'YYYY-MM-DD HH24:MI:SS') as end_register_local,
        to_char(start_activity_date, 'YYYY-MM-DD HH24:MI:SS') as start_activity_local,
        to_char(end_register_date AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') as end_register_utc,
        to_char(start_activity_date AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') as start_activity_utc
      FROM activity 
      WHERE activity_id = 1
    `;
    const debugTimeResult = await this.dataSource!.query(debugTimeQuery);
    console.log(`🔍 [advanceStatesOnce] Activity 1 time details:`, debugTimeResult);

    // 🔍 Debug: ตรวจสอบกิจกรรมที่ควรส่งอีเมล
    const debugOpenRegisterQuery = `
      SELECT 
        activity_id, 
        activity_name, 
        activity_state, 
        event_format,
        activity_status,
        start_register_date,
        end_register_date,
        status
      FROM activity 
      WHERE status = 'Active' 
        AND activity_state = 'Open Register'
        AND activity_status = 'Public'
        AND event_format IN ('Onsite', 'Online')
    `;
    const debugOpenRegisterResult = await this.dataSource!.query(debugOpenRegisterQuery);
    console.log(`🔍 [advanceStatesOnce] Activities that should send email:`, debugOpenRegisterResult);

    // ✅ Debug: ตรวจสอบวันที่ของกิจกรรม ID 14
    const debugActivity14Query = `
      SELECT 
        activity_id,
        activity_name,
        activity_state,
        special_start_register_date,
        start_register_date,
        end_register_date,
        start_activity_date,
        end_activity_date
      FROM activity 
      WHERE activity_id = 14
    `;
    const activity14Result = await this.dataSource!.query(debugActivity14Query);
    console.log(`🔍 [advanceStatesOnce] Activity 14 details:`, activity14Result);

    const qr = this.dataSource!.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    // ✅ ใช้เวลาปัจจุบันโดยไม่เพิ่ม timezone offset
    const nowRef = freezeNow ?? new Date();
    
    // ✅ แปลงเป็นเวลาท้องถิ่นสำหรับแสดงผล
    const localTime = dayjs(nowRef).tz("Asia/Bangkok");
    const utcTime = dayjs(nowRef).utc();
    
    // ✅ แปลงเวลาเป็น local time สำหรับการเปรียบเทียบ
    const localTimeForDB = localTime.format('YYYY-MM-DD HH:mm:ss');
    
    console.log(`🕐 [advanceStatesOnce] Local time: ${localTime.format('DD/MM/YYYY HH:mm:ss')} (Asia/Bangkok)`);
    console.log(`🕐 [advanceStatesOnce] UTC time: ${utcTime.format('DD/MM/YYYY HH:mm:ss')} (UTC)`);
    console.log(`🕐 [advanceStatesOnce] Local time for DB: ${localTimeForDB}`);
    console.log(`🕐 [advanceStatesOnce] Current time:`, nowRef.toISOString());

    const run = async (sql: string, params: unknown[]): Promise<any[]> => {
      // ✅ ใช้ UTC time สำหรับการเปรียบเทียบ
      const utcParams = params.map(param => {
        if (param instanceof Date) {
          return toUTCString(param); // ใช้ UTC time
        }
        return param;
      });
      
      const [rows, rowCount] = await qr.query(sql, utcParams);
      console.log(`🔍 [advanceStatesOnce] Query result:`, rows);
      console.log(`🔍 [advanceStatesOnce] SQL:`, sql);
      console.log(`🔍 [advanceStatesOnce] Original params:`, params);
      console.log(`🔍 [advanceStatesOnce] UTC params:`, utcParams);

      // ✅ Debug: ตรวจสอบการเปรียบเทียบเวลา
      if (sql.includes('Open Register') && sql.includes('Close Register')) {
        const timeCheckQuery = `
          SELECT 
            activity_id,
            activity_name,
            activity_state,
            end_register_date,
            start_activity_date,
            $1::timestamp as current_time,
            $1::timestamp >= end_register_date as end_register_check,
            $1::timestamp < start_activity_date as start_activity_check,
            to_char(end_register_date, 'YYYY-MM-DD HH24:MI:SS') as end_register_local,
            to_char(start_activity_date, 'YYYY-MM-DD HH24:MI:SS') as start_activity_local,
            to_char($1::timestamp, 'YYYY-MM-DD HH24:MI:SS') as current_time_local,
            to_char($1::timestamp AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI:SS') as current_time_bangkok
          FROM activity 
          WHERE activity_state = 'Open Register' 
        AND status = 'Active'
            AND end_register_date IS NOT NULL
        `;
        const timeCheckResult = await qr.query(timeCheckQuery, utcParams);
        console.log(`🔍 [advanceStatesOnce] Time comparison check:`, timeCheckResult);
      }

      // ✅ ตรวจสอบว่า rows เป็น array หรือไม่
      const safeRows = Array.isArray(rows) ? rows : [];
      console.log(`🔍 [advanceStatesOnce] Extracted rows:`, safeRows);
      return safeRows;
    };

    try {
      // 1) Not Start -> Special Open Register (สำหรับกิจกรรมที่ไม่ใช่ Course)
      const ids1 = await run(
        `
        UPDATE activity
           SET activity_state = 'Special Open Register',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Not Start'
           AND event_format != 'Course'
           AND special_start_register_date IS NOT NULL
           AND $1::timestamp >= special_start_register_date
           AND (start_register_date IS NULL OR $1::timestamp < start_register_date)
        RETURNING activity_id, activity_name, presenter_company_name, type, recieve_hours, image_url, url, start_activity_date, end_activity_date, description, seat, end_register_date, event_format, activity_status
        `,
        [nowRef]
      );

      // ส่งอีเมลแจ้งเตือนเมื่อกิจกรรมเปลี่ยนจาก Not Start เป็น Special Open Register
      if (ids1.length > 0) {
        console.log(`📧 [advanceStatesOnce] Found ${ids1.length} activities that just changed to Special Open Register`);
        console.log(`📧 [advanceStatesOnce] Activities:`, ids1.map(a => ({ id: a.activity_id, name: a.activity_name, format: a.event_format, status: a.activity_status })));

        for (const activity of ids1) {
          try {
            console.log(`📧 [advanceStatesOnce] Processing special open register activity: ${activity.activity_id} - ${activity.activity_name}`);

            // ตรวจสอบว่า activity ยังเป็น Special Open Register อยู่หรือไม่
            const currentState = await qr.query(
              `SELECT activity_state FROM activity WHERE activity_id = $1`,
              [activity.activity_id]
            );

            console.log(`📧 [advanceStatesOnce] Current state for activity ${activity.activity_id}:`, currentState[0]?.activity_state);

            if (currentState.length > 0 && currentState[0].activity_state === 'Special Open Register') {
              console.log(`📧 [advanceStatesOnce] Calling sendEmailToStudentsByRiskStatus for activity: ${activity.activity_id}`);
              await sendEmailToStudentsByRiskStatus(activity, 'Risk', 'OpenRegisterTemplate');
              console.log(`✅ [advanceStatesOnce] Special open register email sent successfully for activity: ${activity.activity_id}`);
            } else {
              console.log(`⚠️ [advanceStatesOnce] Activity ${activity.activity_id} state changed, skipping email send`);
            }
          } catch (emailError) {
            console.error(`❌ [advanceStatesOnce] Failed to send special open register email for activity ${activity.activity_id}:`, emailError);
            console.error(`❌ [advanceStatesOnce] Error details:`, emailError);
          }
        }
      } else {
        console.log(`📧 [advanceStatesOnce] No activities changed to Special Open Register at ${localTime.format('DD/MM/YYYY HH:mm:ss')} (Local)`);
      }

      // 2) Not Start -> Open Register (สำหรับกิจกรรมที่ไม่ใช่ Course)
      const ids2 = await run(
        `
        UPDATE activity
           SET activity_state = 'Open Register',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Not Start'
           AND activity_status = 'Public'
           AND event_format IN ('Onsite', 'Online')
           AND start_register_date IS NOT NULL
           AND $1::timestamp >= start_register_date
           AND (end_register_date IS NULL OR $1::timestamp < end_register_date)
        RETURNING activity_id, activity_name, presenter_company_name, type, recieve_hours, image_url, url, start_activity_date, end_activity_date, description, seat, end_register_date, event_format, activity_status
        `,
        [nowRef]
      );

      // ส่งอีเมลแจ้งเตือนเมื่อกิจกรรมเพิ่งเปลี่ยนจาก Not Start เป็น Open Register
      if (ids2.length > 0) {
        console.log(`📧 [advanceStatesOnce] Found ${ids2.length} activities that just opened for registration`);
        console.log(`📧 [advanceStatesOnce] Activities:`, ids2.map(a => ({ id: a.activity_id, name: a.activity_name, format: a.event_format, status: a.activity_status })));

        for (const activity of ids2) {
          try {
            console.log(`📧 [advanceStatesOnce] Processing open register activity: ${activity.activity_id} - ${activity.activity_name}`);

            // ตรวจสอบว่า activity ยังเป็น Open Register อยู่หรือไม่
            const currentState = await qr.query(
              `SELECT activity_state FROM activity WHERE activity_id = $1`,
              [activity.activity_id]
            );

            console.log(`📧 [advanceStatesOnce] Current state for activity ${activity.activity_id}:`, currentState[0]?.activity_state);

            if (currentState.length > 0 && currentState[0].activity_state === 'Open Register') {
              console.log(`📧 [advanceStatesOnce] Calling sendEmailToStudentsByRiskStatus for activity: ${activity.activity_id}`);
              await sendEmailToStudentsByRiskStatus(activity, 'Normal', 'OpenRegisterTemplate');
              console.log(`✅ [advanceStatesOnce] Open register email sent successfully for activity: ${activity.activity_id}`);
            } else {
              console.log(`⚠️ [advanceStatesOnce] Activity ${activity.activity_id} state changed, skipping email send`);
            }
          } catch (emailError) {
            console.error(`❌ [advanceStatesOnce] Failed to send open register email for activity ${activity.activity_id}:`, emailError);
            console.error(`❌ [advanceStatesOnce] Error details:`, emailError);
          }
        }
      } else {
        console.log(`📧 [advanceStatesOnce] No new activities opened for registration at ${localTime.format('DD/MM/YYYY HH:mm:ss')} (Local)`);
      }

      // 2.5) Not Start -> Start Activity (สำหรับกิจกรรมที่เป็น Course)

      // 🔍 Debug: ตรวจสอบกิจกรรม Course ที่เป็น Not Start
      const debugCourseQuery = `
        SELECT 
          activity_id, 
          activity_name, 
          activity_state, 
          event_format,
          start_activity_date,
          end_activity_date,
          $1::timestamp as current_time,
          $1::timestamp >= start_activity_date as time_check
        FROM activity 
        WHERE status = 'Active' 
          AND event_format = 'Course' 
          AND activity_state = 'Not Start'
      `;
      const debugCourseResult = await qr.query(debugCourseQuery, [nowRef]);
      console.log(`🔍 [advanceStatesOnce] Course activities with Not Start state:`, debugCourseResult);

      const ids2_5 = await run(
        `
        UPDATE activity
           SET activity_state = 'Start Activity',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Not Start'
           AND event_format = 'Course'
           AND start_activity_date IS NOT NULL
           AND $1::timestamp >= start_activity_date
           AND (end_activity_date IS NULL OR $1::timestamp < end_activity_date)
        RETURNING activity_id, activity_name, presenter_company_name, type, recieve_hours, image_url, url, start_activity_date, end_activity_date, description
        `,
        [nowRef]
      );

      // ส่งอีเมลแจ้งเตือนเมื่อ Course เริ่มต้น (เฉพาะกิจกรรมที่เพิ่งเปลี่ยน state)
      if (ids2_5.length > 0) {
        console.log(`📧 [advanceStatesOnce] Found ${ids2_5.length} Course activities that just started`);
        console.log(`📧 [advanceStatesOnce] Activities:`, ids2_5.map(a => ({ id: a.activity_id, name: a.activity_name })));

        for (const activity of ids2_5) {
          try {
            console.log(`📧 [advanceStatesOnce] Processing activity: ${activity.activity_id} - ${activity.activity_name}`);

            // ตรวจสอบว่า activity ยังเป็น Start Activity อยู่หรือไม่
            const currentState = await qr.query(
              `SELECT activity_state FROM activity WHERE activity_id = $1`,
              [activity.activity_id]
            );

            console.log(`📧 [advanceStatesOnce] Current state for activity ${activity.activity_id}:`, currentState[0]?.activity_state);

            if (currentState.length > 0 && currentState[0].activity_state === 'Start Activity') {
              console.log(`📧 [advanceStatesOnce] Calling sendCourseStartEmail for activity: ${activity.activity_id}`);
              await sendCourseStartEmail(activity);
              console.log(`✅ [advanceStatesOnce] Email sent successfully for activity: ${activity.activity_id}`);
            } else {
              console.log(`⚠️ [advanceStatesOnce] Activity ${activity.activity_id} state changed, skipping email send`);
            }
          } catch (emailError) {
            console.error(`❌ [advanceStatesOnce] Failed to send course start email for activity ${activity.activity_id}:`, emailError);
            console.error(`❌ [advanceStatesOnce] Error details:`, emailError);
          }
        }
      } else {
        console.log(`📧 [advanceStatesOnce] No new Course activities started at ${localTime.format('DD/MM/YYYY HH:mm:ss')} (Local)`);
      }

      // 3) Special Open Register -> Open Register (ไม่ส่งอีเมล)
      const ids3 = await run(
        `
        UPDATE activity
           SET activity_state = 'Open Register',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Special Open Register'
           AND activity_status = 'Public'
           AND event_format IN ('Onsite', 'Online')
           AND start_register_date IS NOT NULL
           AND $1::timestamp >= start_register_date
           AND (end_register_date IS NULL OR $1::timestamp < end_register_date)
        RETURNING activity_id, activity_name, presenter_company_name, type, recieve_hours, image_url, url, start_activity_date, end_activity_date, description, seat, end_register_date, event_format, activity_status
        `,
        [nowRef]
      );

      // ส่งอีเมลแจ้งเตือนเมื่อกิจกรรมเปลี่ยนจาก Special Open Register เป็น Open Register
      if (ids3.length > 0) {
        console.log(`📧 [advanceStatesOnce] Found ${ids3.length} activities that changed from Special to Open Register`);
        console.log(`📧 [advanceStatesOnce] Activities:`, ids3.map(a => ({ id: a.activity_id, name: a.activity_name, format: a.event_format, status: a.activity_status })));

        for (const activity of ids3) {
          try {
            console.log(`📧 [advanceStatesOnce] Processing special to open register activity: ${activity.activity_id} - ${activity.activity_name}`);

            // ตรวจสอบว่า activity ยังเป็น Open Register อยู่หรือไม่
            const currentState = await qr.query(
              `SELECT activity_state FROM activity WHERE activity_id = $1`,
              [activity.activity_id]
            );

            console.log(`📧 [advanceStatesOnce] Current state for activity ${activity.activity_id}:`, currentState[0]?.activity_state);

            if (currentState.length > 0 && currentState[0].activity_state === 'Open Register') {
              console.log(`📧 [advanceStatesOnce] Calling sendEmailToStudentsByRiskStatus for activity: ${activity.activity_id}`);
              await sendEmailToStudentsByRiskStatus(activity, 'Normal', 'OpenRegisterTemplate');
              console.log(`✅ [advanceStatesOnce] Open register email sent successfully for activity: ${activity.activity_id}`);
            } else {
              console.log(`⚠️ [advanceStatesOnce] Activity ${activity.activity_id} state changed, skipping email send`);
            }
          } catch (emailError) {
            console.error(`❌ [advanceStatesOnce] Failed to send open register email for activity ${activity.activity_id}:`, emailError);
            console.error(`❌ [advanceStatesOnce] Error details:`, emailError);
          }
        }
      } else {
        console.log(`📧 [advanceStatesOnce] No activities changed from Special to Open Register at ${localTime.format('DD/MM/YYYY HH:mm:ss')} (Local)`);
      }

      // 4) Open Register -> Close Register  ← (คุณพิมพ์ว่า "End Register" แต่ enum จริงคือ "Close Register")
      const ids4 = await run(
        `
        UPDATE activity
           SET activity_state = 'Close Register',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Open Register'
           AND end_register_date IS NOT NULL
           AND $1::timestamp >= end_register_date
           AND (start_activity_date IS NULL OR $1::timestamp < start_activity_date)
        RETURNING activity_id
        `,
        [nowRef]
      );

      // 5) Close Register -> Start Activity
      const ids5 = await run(
        `
        UPDATE activity
           SET activity_state = 'Start Activity',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Close Register'
           AND activity_status = 'Public'
           AND event_format IN ('Onsite', 'Online')
           AND start_activity_date IS NOT NULL
           AND $1::timestamp >= start_activity_date
           AND (end_activity_date IS NULL OR $1::timestamp < end_activity_date)
        RETURNING activity_id, activity_name, presenter_company_name, type, recieve_hours, image_url, url, start_activity_date, end_activity_date, description, seat, end_register_date, event_format, activity_status
        `,
        [nowRef]
      );

      // ไม่ส่งอีเมลเมื่อเปลี่ยนจาก Close Register เป็น Start Activity
      if (ids5.length > 0) {
        console.log(`📧 [advanceStatesOnce] Found ${ids5.length} activities that just started (Close Register -> Start Activity, no email sent)`);
      } else {
        console.log(`📧 [advanceStatesOnce] No activities started (Close Register -> Start Activity) at ${localTime.format('DD/MM/YYYY HH:mm:ss')} (Local)`);
      }

      // 6) Start Activity -> End Activity
      const ids6 = await run(
        `
        UPDATE activity
           SET activity_state = 'End Activity',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Start Activity'
           AND end_activity_date IS NOT NULL
           AND $1::timestamp >= end_activity_date
        RETURNING activity_id
        `,
        [nowRef]
      );

      // 7) End Activity -> Start Assessment (เมื่อถึง start_assessment)
      const ids7 = await run(
        `
        UPDATE activity
           SET activity_state = 'Start Assessment',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'End Activity'
           AND start_assessment IS NOT NULL
           AND $1::timestamp >= start_assessment
        RETURNING activity_id
        `,
        [nowRef]
      );

      // 8) Start Assessment -> End Assessment (เมื่อถึง end_assessment)
      const ids8 = await run(
        `
        UPDATE activity
           SET activity_state = 'End Assessment',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Start Assessment'
           AND end_assessment IS NOT NULL
           AND $1::timestamp >= end_assessment
        RETURNING activity_id
        `,
        [nowRef]
      );

      await qr.commitTransaction();
      return {
        notStartToSpecial: ids1.length,
        notStartToOpen: ids2.length,
        notStartToStartActivity: ids2_5.length, // เพิ่ม transition ใหม่
        specialToOpen: ids3.length,
        openToClose: ids4.length,
        closeToStart: ids5.length,
        startToEnd: ids6.length,
        endToStartAssess: ids7.length,
        startAssessToEnd: ids8.length,
        updatedIds: {
          notStartToSpecial: ids1.map((r: any) => r.activity_id),
          notStartToOpen: ids2.map((r: any) => r.activity_id),
          notStartToStartActivity: ids2_5.map((r: any) => r.activity_id), // เพิ่ม transition ใหม่
          specialToOpen: ids3.map((r: any) => r.activity_id),
          openToClose: ids4.map((r: any) => r.activity_id),
          closeToStart: ids5.map((r: any) => r.activity_id),
          startToEnd: ids6.map((r: any) => r.activity_id),
          endToStartAssess: ids7.map((r: any) => r.activity_id),
          startAssessToEnd: ids8.map((r: any) => r.activity_id),
        },
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ✅ เพิ่ม search method
  public async searchActivities(searchTerm: string): Promise<Activity[]> {
    try {
      await this.initialize();
      const query = `
        SELECT 
          *,
          COALESCE(registered_count, 0) as registered_count
        FROM activity 
        WHERE (
          LOWER(activity_name) LIKE LOWER($1) OR
          LOWER(description) LIKE LOWER($1) OR
          LOWER(presenter_company_name) LIKE LOWER($1)
        )
        AND status = 'Active'
        ORDER BY create_activity_date DESC
      `;
      const searchPattern = `%${searchTerm}%`;
      const result = await this.dataSource!.query(query, [searchPattern]);
      return result;
    } catch (error) {
      console.error("❌ Error searching activities:", error);
      throw error;
    }
  }


}
