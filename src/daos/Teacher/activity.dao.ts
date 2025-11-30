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
      // ✅ สำหรับ Date object ให้ใช้ local time components เพื่อเก็บเป็น local time
      // ✅ เพราะ PostgreSQL เก็บ timestamp without timezone (local time)
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return `${input.getFullYear()}-${pad(input.getMonth() + 1)}-${pad(input.getDate())} ${pad(input.getHours())}:${pad(input.getMinutes())}:${pad(input.getSeconds())}`;
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
          this.sanitizeDate(data.special_start_register_date) || null,
          this.sanitizeDate(data.start_register_date) || null,
          this.sanitizeDate(data.end_register_date) || null,
          this.sanitizeDate(data.start_activity_date) || null,
          this.sanitizeDate(data.end_activity_date) || null,
          this.sanitizeDate(data.start_assessment) || null,
          this.sanitizeDate(data.end_assessment) || null,
          data.image_url || "ไม่ระบุ",
          data.activity_status || "Private",
          data.activity_state || "Not Start",
          data.status || "Active",
          // ✅ ถ้าเป็น Onsite และไม่มี url ให้เป็น null แทน "ไม่ระบุ"
          data.event_format === "Onsite" 
            ? (data.url && data.url.trim() !== "" ? data.url : null)
            : (data.url || "ไม่ระบุ"),
          data.room_id ?? null,
          data.assessment_id ?? null,
          new Date(), // last_update_activity_date
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
    try {
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

      // ✅ ตรวจสอบและ return empty array ถ้า null หรือ undefined
      if (!activities || !Array.isArray(activities)) {
        console.warn("⚠️ getAllActivitiesDao: No activities found or invalid response");
        return [];
      }

      console.log(`✅ getAllActivitiesDao: Retrieved ${activities.length} activities`);
      return activities;
    } catch (error) {
      console.error("❌ getAllActivitiesDao error:", error);
      this.logDbError("getAllActivitiesDao", error);
      
      // ✅ return empty array แทน throw error เพื่อให้ frontend ยังทำงานได้
      return [];
    }
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
    // ✅ JOIN กับ activity_certificate_template เพื่อดึงข้อมูล certificate template
    const rows: any[] = await this.dataSource!.query(
      `
        SELECT 
          a.activity_id,
          a.activity_name,
          a.presenter_company_name,
          a.type,
          a.description,
          a.seat,
          a.recieve_hours,
          a.event_format,
          to_char(a.create_activity_date, 'YYYY-MM-DD HH24:MI:SS') as create_activity_date,
          to_char(a.special_start_register_date, 'YYYY-MM-DD HH24:MI:SS') as special_start_register_date,
          to_char(a.start_register_date, 'YYYY-MM-DD HH24:MI:SS') as start_register_date,
          to_char(a.end_register_date, 'YYYY-MM-DD HH24:MI:SS') as end_register_date,
          to_char(a.start_activity_date, 'YYYY-MM-DD HH24:MI:SS') as start_activity_date,
          to_char(a.end_activity_date, 'YYYY-MM-DD HH24:MI:SS') as end_activity_date,
          to_char(a.start_assessment, 'YYYY-MM-DD HH24:MI:SS') as start_assessment,
          to_char(a.end_assessment, 'YYYY-MM-DD HH24:MI:SS') as end_assessment,
          a.image_url,
          a.activity_status,
          a.activity_state,
          a.status,
          to_char(a.last_update_activity_date, 'YYYY-MM-DD HH24:MI:SS') as last_update_activity_date,
          a.url,
          a.room_id,
          a.assessment_id,
          COALESCE(a.registered_count, 0) as registered_count,
          cb.certificate_base_id,
          cb.template_image_url as certificate_template_url,
          cb.ocr_data as certificate_ocr_data,
          cb.image_analysis as certificate_image_analysis,
          cb.description as upload_certificate_description
        FROM activity a
        LEFT JOIN certificate_base cb ON a.activity_id = cb.activity_id
        WHERE a.activity_id = $1
      `,
      [id]
    );

    const row = rows?.[0];
    if (!row) return null;

    // ✅ Debug: ตรวจสอบ certificate fields
    console.log("🔍 [ActivityDAO] Certificate fields from DB:", {
      activity_id: row.activity_id,
      activity_name: row.activity_name,
      event_format: row.event_format,
      certificate_base_id: row.certificate_base_id,
      certificateBase_template_url: row.certificate_template_url,
      certificateBase_description: row.upload_certificate_description,
      // Backward compatibility
      certificate_template_url: row.certificate_template_url,
      upload_certificate_description: row.upload_certificate_description,
      certificate_ocr_data: row.certificate_ocr_data,
      certificate_image_analysis: row.certificate_image_analysis
    });

    // Log detailed certificate base information
    if (row.certificate_base_id) {
      console.log("📄 [ActivityDAO] Certificate base found in database:", {
        activity_id: row.activity_id,
        certificate_base_id: row.certificate_base_id,
        template_image_url: row.certificate_template_url,
        description: row.upload_certificate_description,
        has_ocr_data: !!row.certificate_ocr_data,
        has_image_analysis: !!row.certificate_image_analysis,
        ocr_data_keys: row.certificate_ocr_data ? Object.keys(row.certificate_ocr_data) : [],
        image_analysis_keys: row.certificate_image_analysis ? Object.keys(row.certificate_image_analysis) : []
      });
    } else {
      console.log("⚠️ [ActivityDAO] No certificate base found for activity:", row.activity_id);
    }

    // ✅ ดึง certificateBase จาก database แทนการสร้าง object ใหม่
    let certificateBase = null;
    if (row.certificate_base_id) {
      try {
        const certificateBaseData = await this.dataSource!.query(
          `SELECT * FROM certificate_base WHERE certificate_base_id = $1`,
          [row.certificate_base_id]
        );
        
        if (certificateBaseData && certificateBaseData.length > 0) {
          certificateBase = certificateBaseData[0];
          console.log("✅ [ActivityDAO] Retrieved certificateBase from database:", {
            certificate_base_id: certificateBase.certificate_base_id,
            certificate_name: certificateBase.certificate_name,
            certificate_type: certificateBase.certificate_type,
            organize_base_name: certificateBase.organize_base_name,
            supervisor_name1: certificateBase.supervisor_name1,
            get_certificate_date: certificateBase.get_certificate_date
          });
        }
      } catch (error) {
        console.error("❌ [ActivityDAO] Error retrieving certificateBase:", error);
        // ✅ Fallback: สร้าง object ถ้าดึงไม่ได้
        certificateBase = {
          certificate_base_id: row.certificate_base_id,
          activity_id: row.activity_id,
          certificate_name: `Certificate for ${row.activity_name}`,
          certificate_source: "Course Activity",
          template_image_url: row.certificate_template_url,
          ocr_data: row.certificate_ocr_data,
          image_analysis: row.certificate_image_analysis,
          description: row.upload_certificate_description,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };
      }
    }

    console.log("🔍 [ActivityDAO] Final certificateBase object:", certificateBase ? {
      certificate_base_id: certificateBase.certificate_base_id,
      certificate_name: certificateBase.certificate_name
    } : null);

    // ✅ ดึงข้อมูลอาหารจาก activity_food แยก query
    let activityFood: any[] = [];
    try {
      const foodRows = await this.dataSource!.query(
        `SELECT activity_food_id, activity_id, food_id 
         FROM activity_food 
         WHERE activity_id = $1`,
        [id]
      );
      
      if (foodRows && foodRows.length > 0) {
        activityFood = foodRows;
        console.log("🍽️ [ActivityDAO] Activity foods found:", {
          activity_id: id,
          foods_count: activityFood.length,
          foods: activityFood.map((af: any) => ({ activity_food_id: af.activity_food_id, food_id: af.food_id }))
        });
      } else {
        console.log("🍽️ [ActivityDAO] No activity foods found for activity:", id);
      }
    } catch (error) {
      console.error("❌ [ActivityDAO] Error fetching activity foods:", error);
      activityFood = [];
    }

    // เติม field ที่ frontend คาดหวัง
    (row as any).activityFood = activityFood;
    (row as any).certificateBase = certificateBase;

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
           AND (special_start_register_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp >= ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp
           AND (start_register_date IS NULL OR (start_register_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp > ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp)
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
              // ป้องกันไม่ให้ส่งถ้ายังไม่ได้ใช้งานจริง
              // await sendEmailToStudentsByRiskStatus(activity, 'Risk', 'OpenRegisterTemplate');
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
           AND (start_register_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp <= ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp
           AND (end_register_date IS NULL OR (end_register_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp > ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp)
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
              // ป้องกันไม่ให้ส่งถ้ายังไม่ได้ใช้งานจริง
              // await sendEmailToStudentsByRiskStatus(activity, 'Normal', 'OpenRegisterTemplate');
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
           AND (start_activity_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp <= ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp
           AND (end_activity_date IS NULL OR (end_activity_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp > ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp)
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
           AND (start_register_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp <= ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp
           AND (end_register_date IS NULL OR (end_register_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp > ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp)
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
              // ป้องกันไม่ให้ส่งถ้ายังไม่ได้ใช้งานจริง
              // await sendEmailToStudentsByRiskStatus(activity, 'Normal', 'OpenRegisterTemplate');
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
           AND (end_register_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp <= ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp
           AND (start_activity_date IS NULL OR (start_activity_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp > ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp)
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
           AND (start_activity_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp <= ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp
           AND (end_activity_date IS NULL OR (end_activity_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp > ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp)
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
           AND (end_activity_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp <= ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp
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
           AND (start_assessment AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp <= ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp
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
           AND (end_assessment AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp <= ($1::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')::timestamp
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

  // ✅ เมธอดใหม่: ดึงข้อมูลนักเรียนที่ลงทะเบียนทั้งหมด
  public async getEnrolledStudentsForActivity(activityId: number): Promise<any[]> {
    try {
      await this.checkConnection();
      
      // ✅ ดึงข้อมูลนิสิตที่ลงทะเบียนทั้งหมด โดยไม่ต้องมีเงื่อนไข time_in/time_out
      const query = `
        SELECT 
          s.students_id as id,
          s.first_name_tha,
          s.last_name_tha,
          d.department_short_name,
          u.username,
          ad.time_in,
          ad.time_out
        FROM students s
        JOIN users u ON s.users_id = u.users_id
        JOIN department d ON s.department_id = d.department_id
        JOIN "join" j ON s.students_id = j.students_id
        JOIN activity_detail ad ON j.activity_detail_id = ad.activity_detail_id
        WHERE ad.activity_id = $1 
          AND ad.status = 'Registered'
          AND j.status = 'Pending'
        ORDER BY s.first_name_tha, s.last_name_tha
      `;
      
      const result = await this.dataSource!.query(query, [activityId]);
      console.log(`📊 Found ${result.length} enrolled students for activity ${activityId} (all registered students)`);
      return result;
    } catch (error) {
      console.error("❌ Error getting enrolled students:", error);
      throw error;
    }
  }

  // ✅ ActivityDetail DAO Methods
  public async getAllActivityDetails(): Promise<any[]> {
    try {
      await this.checkConnection();
      
      const query = `
        SELECT 
          ad.activity_detail_id,
          ad.activity_id,
          ad.activity_food_id,
          ad.register_date,
          ad.time_in,
          ad.time_out,
          ad.status,
          a.activity_name,
          af.food_id,
          f.food_name
        FROM activity_detail ad
        LEFT JOIN activity a ON ad.activity_id = a.activity_id
        LEFT JOIN activity_food af ON ad.activity_food_id = af.activity_food_id
        LEFT JOIN food f ON af.food_id = f.food_id
        ORDER BY ad.register_date DESC
      `;
      
      const result = await this.dataSource!.query(query);
      console.log(`📊 Found ${result.length} activity details`);
      return result;
    } catch (error) {
      console.error("❌ Error getting all activity details:", error);
      throw error;
    }
  }

  public async getActivityDetailById(id: number): Promise<any | null> {
    try {
      await this.checkConnection();
      
      const query = `
        SELECT 
          ad.activity_detail_id,
          ad.activity_id,
          ad.activity_food_id,
          ad.register_date,
          ad.time_in,
          ad.time_out,
          ad.status,
          a.activity_name,
          af.food_id,
          f.food_name
        FROM activity_detail ad
        LEFT JOIN activity a ON ad.activity_id = a.activity_id
        LEFT JOIN activity_food af ON ad.activity_food_id = af.activity_food_id
        LEFT JOIN food f ON af.food_id = f.food_id
        WHERE ad.activity_detail_id = $1
      `;
      
      const result = await this.dataSource!.query(query, [id]);
      console.log(`📊 Found activity detail: ${result.length > 0 ? 'Yes' : 'No'}`);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("❌ Error getting activity detail by ID:", error);
      throw error;
    }
  }

  public async updateActivityDetail(id: number, data: any): Promise<any> {
    try {
      await this.checkConnection();
      
      const query = `
        UPDATE activity_detail
        SET 
          activity_id = $1,
          activity_food_id = $2,
          register_date = $3,
          time_in = $4,
          time_out = $5,
          status = $6
        WHERE activity_detail_id = $7
        RETURNING *
      `;
      
      const values = [
        data.activity_id,
        data.activity_food_id,
        data.register_date,
        data.time_in,
        data.time_out,
        data.status,
        id
      ];
      
      const result = await this.dataSource!.query(query, values);
      console.log(`✅ Updated activity detail: ${result.length > 0 ? 'Success' : 'Not found'}`);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("❌ Error updating activity detail:", error);
      throw error;
    }
  }

  public async resetActivityDetailsAndJoins(activityId: number): Promise<any> {
    try {
      await this.checkConnection();
      
      console.log(`🗑️ Starting DELETE ALL for activity ${activityId}...`);
      
      // 1. หาจำนวน records ที่จะลบ
      const countQuery = `
        SELECT 
          COUNT(DISTINCT ad.activity_detail_id) as activity_detail_count,
          COUNT(j.join_id) as join_count
        FROM activity_detail ad
        LEFT JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
        WHERE ad.activity_id = $1
      `;
      
      const countResult = await this.dataSource!.query(countQuery, [activityId]);
      const counts = countResult[0];
      
      console.log(`📊 Found ${counts.activity_detail_count} activity details and ${counts.join_count} joins to DELETE`);
      
      // 2. ลบ join records ก่อน (เพราะมี foreign key)
      const deleteJoinQuery = `
        DELETE FROM "join"
        WHERE activity_detail_id IN (
          SELECT activity_detail_id 
          FROM activity_detail 
          WHERE activity_id = $1
        )
        RETURNING join_id
      `;
      
      const joinResult = await this.dataSource!.query(deleteJoinQuery, [activityId]);
      console.log(`🗑️ Deleted ${joinResult.length} join records`);
      
      // 3. ลบ activity_detail records
      const deleteActivityDetailQuery = `
        DELETE FROM activity_detail
        WHERE activity_id = $1
        RETURNING activity_detail_id
      `;
      
      const activityDetailResult = await this.dataSource!.query(deleteActivityDetailQuery, [activityId]);
      console.log(`🗑️ Deleted ${activityDetailResult.length} activity detail records`);
      
      // 4. อัพเดท registered_count เป็น 0
      const updateCountQuery = `
        UPDATE activity
        SET registered_count = 0
        WHERE activity_id = $1
        RETURNING activity_id, registered_count
      `;
      
      const countUpdateResult = await this.dataSource!.query(updateCountQuery, [activityId]);
      console.log(`✅ Updated registered_count to 0`);
      
      // 5. Reset sequence ของ activity_detail_id
      try {
        // ตรวจสอบ sequence ปัจจุบัน
        const currentSeqResult = await this.dataSource!.query(
          `SELECT last_value FROM activity_detail_activity_detail_id_seq`
        );
        const currentSeq = currentSeqResult[0]?.last_value || 0;
        console.log(`🔍 Current sequence value: ${currentSeq}`);
        
        // Reset sequence เป็น 1 เสมอ (ไม่ว่าจะมีข้อมูลหรือไม่)
        const resetSequenceQuery = `
          SELECT setval('activity_detail_activity_detail_id_seq', 1, false)
        `;
        await this.dataSource!.query(resetSequenceQuery);
        console.log(`✅ Reset activity_detail_id sequence to 1`);
        
        // ตรวจสอบ sequence ใหม่
        const newSeqResult = await this.dataSource!.query(
          `SELECT last_value FROM activity_detail_activity_detail_id_seq`
        );
        const newSeq = newSeqResult[0]?.last_value || 0;
        console.log(`🔍 New sequence value: ${newSeq}`);
        
      } catch (error) {
        console.error("❌ Error resetting sequence:", error);
        // ไม่ throw error เพราะ sequence reset ไม่ใช่ critical
      }
      
      const result = {
        activityId,
        activityDetailsDeleted: activityDetailResult.length,
        joinsDeleted: joinResult.length,
        newRegisteredCount: 0,
        message: `DELETED ALL data for activity ${activityId}`
      };
      
      console.log(`✅ DELETE ALL completed for activity ${activityId}`);
      return result;
    } catch (error) {
      console.error("❌ Error deleting activity details and joins:", error);
      throw error;
    }
  }

  public async resetStudentTimes(activityId: number): Promise<any> {
    try {
      await this.checkConnection();
      
      console.log(`🔄 Starting reset student times for activity ${activityId}...`);
      
      // 1. หาจำนวน records ที่จะ reset
      const countQuery = `
        SELECT COUNT(*) as activity_detail_count
        FROM activity_detail
        WHERE activity_id = $1
      `;
      
      const countResult = await this.dataSource!.query(countQuery, [activityId]);
      const count = countResult[0].activity_detail_count;
      
      console.log(`📊 Found ${count} activity detail records to reset times`);
      
      // 2. Reset time_in และ time_out เป็น NULL
      const resetTimesQuery = `
        UPDATE activity_detail
        SET 
          time_in = NULL,
          time_out = NULL
        WHERE activity_id = $1
        RETURNING activity_detail_id, time_in, time_out
      `;
      
      const resetResult = await this.dataSource!.query(resetTimesQuery, [activityId]);
      console.log(`✅ Reset ${resetResult.length} activity detail records`);
      
      const result = {
        activityId,
        activityDetailsReset: resetResult.length,
        message: `Reset time_in and time_out to NULL for activity ${activityId}`,
        details: {
          resetRecords: resetResult
        }
      };
      
      console.log(`✅ Reset student times completed for activity ${activityId}`);
      return result;
    } catch (error) {
      console.error("❌ Error resetting student times:", error);
      throw error;
    }
  }

  public async checkStudentExists(studentId: number): Promise<boolean> {
    try {
      await this.checkConnection();
      
      const query = `SELECT COUNT(*) as count FROM students WHERE students_id = $1`;
      const result = await this.dataSource!.query(query, [studentId]);
      const count = result[0]?.count || 0;
      
      console.log(`🔍 Student ${studentId} exists: ${count > 0}`);
      return count > 0;
    } catch (error) {
      console.error("❌ Error checking student exists:", error);
      throw error;
    }
  }

  public async getActivityDetailsByActivityId(activityId: number): Promise<any[]> {
    try {
      await this.checkConnection();
      
      // Debug: ตรวจสอบข้อมูลทั้งหมดก่อน
      const debugQuery = `
        SELECT 
          ad.activity_detail_id,
          ad.activity_id,
          ad.activity_food_id,
          ad.register_date,
          ad.time_in,
          ad.time_out,
          ad.status,
          a.activity_name,
          af.food_id,
          f.food_name,
          COUNT(j.join_id) as join_count
        FROM activity_detail ad
        LEFT JOIN activity a ON ad.activity_id = a.activity_id
        LEFT JOIN activity_food af ON ad.activity_food_id = af.activity_food_id
        LEFT JOIN food f ON af.food_id = f.food_id
        LEFT JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
        WHERE ad.activity_id = $1
        GROUP BY ad.activity_detail_id, ad.activity_id, ad.activity_food_id, ad.register_date, 
                 ad.time_in, ad.time_out, ad.status, a.activity_name, af.food_id, f.food_name
        ORDER BY ad.register_date DESC
      `;
      
      const debugResult = await this.dataSource!.query(debugQuery, [activityId]);
      console.log(`🔍 [DEBUG] Activity details for activity ${activityId}:`, debugResult);
      
      // แยก query เป็น 2 ส่วน: activity_detail และ students
      const activityDetailQuery = `
        SELECT 
          ad.activity_detail_id,
          ad.activity_id,
          ad.activity_food_id,
          ad.register_date,
          ad.time_in,
          ad.time_out,
          ad.status,
          a.activity_name,
          af.food_id,
          f.food_name
        FROM activity_detail ad
        LEFT JOIN activity a ON ad.activity_id = a.activity_id
        LEFT JOIN activity_food af ON ad.activity_food_id = af.activity_food_id
        LEFT JOIN food f ON af.food_id = f.food_id
        WHERE ad.activity_id = $1
        ORDER BY ad.register_date DESC
      `;
      
              const joinQuery = `
        SELECT 
          j.activity_detail_id,
          j.join_id,
          j.students_id,
          j.join_date,
          j.status as join_status,
          s.first_name_tha,
          s.last_name_tha,
          u.username
        FROM "join" j
        LEFT JOIN students s ON j.students_id = s.students_id
        LEFT JOIN users u ON s.users_id = u.users_id
        WHERE j.activity_detail_id IN (
          SELECT activity_detail_id 
          FROM activity_detail 
          WHERE activity_id = $1
        )
        ORDER BY j.join_id
      `;
      
      const [activityDetails, joins] = await Promise.all([
        this.dataSource!.query(activityDetailQuery, [activityId]),
        this.dataSource!.query(joinQuery, [activityId])
      ]);
      
      console.log(`🔍 [DEBUG] Raw activity details:`, activityDetails);
      console.log(`🔍 [DEBUG] Raw joins:`, joins);
      
      // รวมข้อมูล activity_detail กับ joins
      const result = activityDetails.map((detail: any) => {
        const detailJoins = joins.filter((join: any) => 
          join.activity_detail_id === detail.activity_detail_id
        );
        
        const finalResult = {
          ...detail,
          joins: detailJoins,
          join_count: detailJoins.length
        };
        
        console.log(`🔍 [DEBUG] Final result for activity_detail_id ${detail.activity_detail_id}:`, finalResult);
        return finalResult;
      });
      
      console.log(`📊 Found ${result.length} activity details with ${joins.length} joins for activity ${activityId}`);
      return result;
    } catch (error) {
      console.error("❌ Error getting activity details by activity ID:", error);
      throw error;
    }
  }

  // ✅ Function 1: ดูนิสิตที่ลงชื่อเข้าร่วมกิจกรรม (มี time_in)
  public async getStudentsCheckedIn(activityId: number): Promise<any[]> {
    try {
      await this.checkConnection();
      
      const query = `
        SELECT 
          s.students_id,
          s.first_name_tha,
          s.last_name_tha,
          u.username,
          d.department_short_name,
          ad.activity_detail_id,
          ad.time_in,
          ad.register_date,
          j.join_date,
          j.status as join_status
        FROM students s
        JOIN users u ON s.users_id = u.users_id
        JOIN department d ON s.department_id = d.department_id
        JOIN "join" j ON s.students_id = j.students_id
        JOIN activity_detail ad ON j.activity_detail_id = ad.activity_detail_id
        WHERE ad.activity_id = $1 
          AND ad.status = 'Registered'
          AND j.status = 'Pending'
          AND ad.time_in IS NOT NULL
        ORDER BY ad.time_in DESC, s.first_name_tha, s.last_name_tha
      `;
      
      const result = await this.dataSource!.query(query, [activityId]);
      console.log(`📊 Found ${result.length} students who checked in for activity ${activityId}`);
      return result;
    } catch (error) {
      console.error("❌ Error getting students who checked in:", error);
      throw error;
    }
  }

  // ✅ Function 2: ดูนิสิตที่ลงชื่อออกกิจกรรม (มี time_out)
  public async getStudentsCheckedOut(activityId: number): Promise<any[]> {
    try {
      await this.checkConnection();
      
      const query = `
        SELECT 
          s.students_id,
          s.first_name_tha,
          s.last_name_tha,
          u.username,
          d.department_short_name,
          ad.activity_detail_id,
          ad.time_in,
          ad.time_out,
          ad.register_date,
          j.join_date,
          j.status as join_status
        FROM students s
        JOIN users u ON s.users_id = u.users_id
        JOIN department d ON s.department_id = d.department_id
        JOIN "join" j ON s.students_id = j.students_id
        JOIN activity_detail ad ON j.activity_detail_id = ad.activity_detail_id
        WHERE ad.activity_id = $1 
          AND ad.status = 'Registered'
          AND j.status = 'Pending'
          AND ad.time_out IS NOT NULL
        ORDER BY ad.time_out DESC, s.first_name_tha, s.last_name_tha
      `;
      
      const result = await this.dataSource!.query(query, [activityId]);
      console.log(`📊 Found ${result.length} students who checked out for activity ${activityId}`);
      return result;
    } catch (error) {
      console.error("❌ Error getting students who checked out:", error);
      throw error;
    }
  }

  /**
   * ดึงโครงสร้าง Assessment ของ Activity (SetNumbers, Questions, Choices)
   */
  public async getAssessmentStructure(activityId: number): Promise<any> {
    try {
      await this.checkConnection();
      
      // ดึงข้อมูล Assessment ที่เชื่อมกับ Activity
      const assessmentQuery = `
        SELECT 
          a.activity_id,
          a.activity_name,
          av.assessment_version_id,
          av.version_no,
          av.is_published,
          av.published_at,
          av.created_at
        FROM activity a
        LEFT JOIN assessment_version av ON a.assessment_version_id = av.assessment_version_id
        WHERE a.activity_id = $1
      `;
      
      const assessmentResult = await this.dataSource!.query(assessmentQuery, [activityId]);
      
      if (assessmentResult.length === 0 || !assessmentResult[0].assessment_version_id) {
        return {
          activity_id: activityId,
          activity_name: assessmentResult[0]?.activity_name || '',
          assessment_version_id: null,
          setNumbers: []
        };
      }
      
      const assessmentVersionId = assessmentResult[0].assessment_version_id;
      
      // ดึงข้อมูล SetNumbers
      const setNumbersQuery = `
        SELECT 
          snv.set_number_version_id,
          snv.order_index,
          snv.name,
          snv.description,
          snv.created_at
        FROM set_number_version snv
        WHERE snv.assessment_version_id = $1
        ORDER BY snv.order_index
      `;
      
      const setNumbersResult = await this.dataSource!.query(setNumbersQuery, [assessmentVersionId]);
      
      // ดึงข้อมูล Questions และ Choices สำหรับแต่ละ SetNumber
      for (const setNumber of setNumbersResult) {
        const questionsQuery = `
          SELECT 
            qv.question_version_id,
            qv.order_index,
            qv.question_text,
            qv.question_type,
            qv.set_number_version_id
          FROM question_version qv
          WHERE qv.set_number_version_id = $1
          ORDER BY qv.order_index
        `;
        
        const questionsResult = await this.dataSource!.query(questionsQuery, [setNumber.set_number_version_id]);
        
        // ดึงข้อมูล Choices สำหรับแต่ละ Question
        for (const question of questionsResult) {
          const choicesQuery = `
            SELECT 
              cv.choice_version_id,
              cv.order_index,
              cv.choice_text,
              cv.question_version_id
            FROM choice_version cv
            WHERE cv.question_version_id = $1
            ORDER BY cv.order_index
          `;
          
          const choicesResult = await this.dataSource!.query(choicesQuery, [question.question_version_id]);
          question.choices = choicesResult;
        }
        
        setNumber.questions = questionsResult;
      }
      
      return {
        ...assessmentResult[0],
        setNumbers: setNumbersResult
      };
    } catch (error) {
      console.error("❌ Error getting assessment structure:", error);
      throw error;
    }
  }

  /**
   * ดึงคำตอบของนักเรียนใน Activity (แยกตาม answer แต่ละข้อ)
   */
  public async getStudentAnswersDetail(activityId: number): Promise<any[]> {
    try {
      await this.checkConnection();
      
      // ตรวจสอบข้อมูล Activity และ Assessment ก่อน
      const activityInfo = await this.dataSource!.query(
        `SELECT activity_id, activity_name, assessment_id FROM activity WHERE activity_id = $1`,
        [activityId]
      );
      
      if (activityInfo.length === 0) {
        console.log(`❌ Activity ${activityId} not found`);
        return [];
      }
      
      const assessmentId = activityInfo[0].assessment_id;
      console.log(`🔍 Activity ${activityId} has Assessment ${assessmentId}`);
      
      // ตรวจสอบว่ามีคำตอบหรือไม่
      const answerCount = await this.dataSource!.query(
        `SELECT COUNT(*) as count FROM answer WHERE assessment_id = $1`,
        [assessmentId]
      );
      
      console.log(`📊 Found ${answerCount[0].count} answers for assessment ${assessmentId}`);
      
      // ถ้าไม่มีคำตอบ ให้แสดงข้อมูลนิสิตที่เข้าร่วมกิจกรรม
      if (parseInt(answerCount[0].count) === 0) {
        console.log(`⚠️ No answers found, returning student participation data`);
        
        const studentQuery = `
          SELECT 
            a.activity_id,
            a.activity_name,
            ad.activity_detail_id,
            ad.time_in,
            ad.time_out,
            ad.register_date,
            j.join_id,
            j.join_date,
            j.status as join_status,
            s.students_id,
            s.first_name_tha,
            s.last_name_tha,
            u.username,
            d.department_short_name,
            NULL as answer_id,
            NULL as answer_text,
            NULL as assessment_id,
            NULL as assessment_version_id,
            NULL as set_number_version_id,
            NULL as question_version_id,
            NULL as choice_version_id,
            NULL as question_text,
            NULL as question_type,
            NULL as question_order,
            NULL as choice_text,
            NULL as choice_id,
            NULL as set_number_name,
            NULL as set_number_order,
            NULL as assessment_version_no
          FROM activity a
          JOIN activity_detail ad ON a.activity_id = ad.activity_id
          JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
          JOIN students s ON j.students_id = s.students_id
          JOIN users u ON s.users_id = u.users_id
          JOIN department d ON s.department_id = d.department_id
          WHERE a.activity_id = $1
          ORDER BY s.first_name_tha, s.last_name_tha
        `;
        
        const result = await this.dataSource!.query(studentQuery, [activityId]);
        console.log(`📊 Found ${result.length} students for activity ${activityId} (no answers yet)`);
        return result;
      }
      
      // ถ้ามีคำตอบ ให้แสดงข้อมูลคำตอบ
      const query = `
        SELECT 
          a.activity_id,
          a.activity_name,
          ad.activity_detail_id,
          ad.time_in,
          ad.time_out,
          ad.register_date,
          j.join_id,
          j.join_date,
          j.status as join_status,
          s.students_id,
          s.first_name_tha,
          s.last_name_tha,
          u.username,
          d.department_short_name,
          ans.answer_id,
          ans.answer_text,
          ans.assessment_id,
          ans.assessment_version_id,
          ans.set_number_version_id,
          ans.question_version_id,
          ans.choice_version_id,
          q.question_text,
          q.question_type,
          q.question_number as question_order,
          c.choice_text,
          c.choice_id,
          sn.name as set_number_name,
          sn.set_number_id as set_number_order,
          av.version_no as assessment_version_no
        FROM activity a
        JOIN activity_detail ad ON a.activity_id = ad.activity_id
        JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
        JOIN students s ON j.students_id = s.students_id
        JOIN users u ON s.users_id = u.users_id
        JOIN department d ON s.department_id = d.department_id
        INNER JOIN answer ans ON j.join_id = ans.join_id AND ans.assessment_id = a.assessment_id
        LEFT JOIN question q ON ans.question_id = q.question_id
        LEFT JOIN choice c ON ans.choice_id = c.choice_id
        LEFT JOIN set_number sn ON ans.set_number_id = sn.set_number_id
        LEFT JOIN assessment_version av ON ans.assessment_version_id = av.assessment_version_id
        WHERE a.activity_id = $1
        ORDER BY 
          s.first_name_tha, s.last_name_tha,
          COALESCE(sn.set_number_id, 0),
          COALESCE(q.question_number, 0),
          COALESCE(c.choice_id, 0),
          COALESCE(ans.answer_id, 0)
      `;
      
      const result = await this.dataSource!.query(query, [activityId]);
      console.log(`📊 Found ${result.length} student answers for activity ${activityId}`);
      return result;
    } catch (error) {
      console.error("❌ Error getting student answers detail:", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล Assessment Structure และ Student Answers รวมกัน
   */
  public async getCompleteAssessmentData(activityId: number): Promise<any> {
    try {
      await this.checkConnection();
      
      // ดึงโครงสร้าง Assessment
      const assessmentStructure = await this.getAssessmentStructure(activityId);
      
      // ดึงคำตอบของนักเรียน
      const studentAnswers = await this.getStudentAnswersDetail(activityId);
      
      // จัดกลุ่มคำตอบตาม student
      const studentsWithAnswers: any = {};
      
      studentAnswers.forEach((answer: any) => {
        const studentKey = `${answer.students_id}_${answer.join_id}`;
        
        if (!studentsWithAnswers[studentKey]) {
          studentsWithAnswers[studentKey] = {
            activity_id: answer.activity_id,
            activity_name: answer.activity_name,
            activity_detail_id: answer.activity_detail_id,
            time_in: answer.time_in,
            time_out: answer.time_out,
            register_date: answer.register_date,
            join_id: answer.join_id,
            join_date: answer.join_date,
            join_status: answer.join_status,
            students_id: answer.students_id,
            first_name_tha: answer.first_name_tha,
            last_name_tha: answer.last_name_tha,
            username: answer.username,
            department_short_name: answer.department_short_name,
            answers: []
          };
        }
        
        // เพิ่มคำตอบ (ถ้ามี)
        if (answer.answer_id) {
          studentsWithAnswers[studentKey].answers.push({
            answer_id: answer.answer_id,
            answer_text: answer.answer_text,
            assessment_id: answer.assessment_id,
            assessment_version_id: answer.assessment_version_id,
            set_number_version_id: answer.set_number_version_id,
            question_version_id: answer.question_version_id,
            choice_version_id: answer.choice_version_id,
            question_text: answer.question_text,
            question_type: answer.question_type,
            question_order: answer.question_order,
            choice_text: answer.choice_text,
            choice_order: answer.choice_order,
            set_number_name: answer.set_number_name,
            set_number_order: answer.set_number_order,
            assessment_version_no: answer.assessment_version_no
          });
        }
      });
      
      // แปลงเป็น array
      const studentsArray = Object.values(studentsWithAnswers);
      
      return {
        success: true,
        message: `Found ${studentsArray.length} students with assessment data for activity ${activityId}`,
        data: {
          assessment_structure: assessmentStructure,
          students: studentsArray
        }
      };
    } catch (error) {
      console.error("❌ Error getting complete assessment data:", error);
      throw error;
    }
  }

  /**
   * ดึงปีทั้งหมดที่มีกิจกรรม Active
   */
  public async getActiveActivityYears(): Promise<number[]> {
    try {
      await this.checkConnection();
      
      const query = `
        SELECT DISTINCT EXTRACT(YEAR FROM start_activity_date) as year
        FROM activity
        WHERE status = 'Active'
          AND start_activity_date IS NOT NULL
        ORDER BY year DESC
      `;
      
      const result = await this.dataSource!.query(query);
      const years = result.map((row: any) => parseInt(row.year));
      
      console.log(`📊 Found ${years.length} distinct years with active activities:`, years);
      return years;
    } catch (error) {
      console.error("❌ Error getting active activity years:", error);
      throw error;
    }
  }

  /**
   * ดึงสรุปกิจกรรมตามช่วงเวลา (สำหรับ dashboard)
   */
  public async getActivitySummary(params: {
    year: number;
    month?: number;
    quarter?: number | "all";
  }): Promise<any[]> {
    try {
      await this.checkConnection();
      
      const { year, month, quarter } = params;
      
      console.log(`📊 Getting activity summary for:`, params);
      
      // สร้างเงื่อนไข WHERE
      let whereConditions = [
        `status = 'Active'`,
        `(event_format = 'Online' OR event_format = 'Onsite')`,
        `EXTRACT(YEAR FROM start_activity_date) = $1`
      ];
      
      const queryParams: any[] = [year];
      
      // ถ้าเลือกไตรมาสเฉพาะ
      if (quarter && quarter !== "all") {
        const quarterMonths: { [key: number]: number[] } = {
          1: [1, 2, 3],
          2: [4, 5, 6],
          3: [7, 8, 9],
          4: [10, 11, 12]
        };
        
        const months = quarterMonths[quarter as number];
        if (months) {
          queryParams.push(months);
          whereConditions.push(`EXTRACT(MONTH FROM start_activity_date) = ANY($${queryParams.length})`);
        }
      } else if (month) {
        // ถ้าเลือกเดือนเฉพาะ (เมื่อ quarter = "all")
        queryParams.push(month);
        whereConditions.push(`EXTRACT(MONTH FROM start_activity_date) = $${queryParams.length}`);
      }
      
      const query = `
        SELECT 
          a.activity_id as "activityId",
          a.activity_name as "activityName",
          a.start_activity_date as "startDate",
          a.event_format as "eventFormat",
          COALESCE(a.registered_count, 0) as registered,
          COALESCE(
            (SELECT COUNT(DISTINCT j.students_id)
             FROM activity_detail ad
             JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
             WHERE ad.activity_id = a.activity_id
               AND ad.time_in IS NOT NULL
               AND ad.time_out IS NOT NULL
               AND j.status = 'Pending'
            ), 0
          ) as "attendedFull",
          COALESCE(
            (SELECT COUNT(DISTINCT j.students_id)
             FROM activity_detail ad
             JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
             WHERE ad.activity_id = a.activity_id
               AND (ad.time_in IS NULL OR ad.time_out IS NULL)
               AND j.status = 'Pending'
            ), 0
          ) as "attendedPartial"
        FROM activity a
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY a.start_activity_date ASC
      `;
      
      const result = await this.dataSource!.query(query, queryParams);
      console.log(`✅ Found ${result.length} activities for summary`);
      return result;
    } catch (error) {
      console.error("❌ Error getting activity summary:", error);
      throw error;
    }
  }

  /**
   * Mock การลงทะเบียนกิจกรรมของนิสิตแบบสุ่ม (เต็มที่นั่งทุกกิจกรรม)
   */
  public async mockAllActivityRegistrations(): Promise<any> {
    try {
      await this.checkConnection();
      
      console.log(`🎲 [mockAllActivityRegistrations] Starting mock for all activities`);
      
      // 1. ดึงกิจกรรมทั้งหมดที่เป็น Active และมี seat > 0
      const activitiesResult = await this.dataSource!.query(
        `SELECT activity_id, activity_name, start_activity_date, end_activity_date, seat, event_format 
         FROM activity 
         WHERE status = 'Active' 
           AND (event_format = 'Online' OR event_format = 'Onsite')
           AND seat > 0
         ORDER BY activity_id`
      );
      
      if (activitiesResult.length === 0) {
        throw new Error("No active activities found");
      }
      
      console.log(`📋 Found ${activitiesResult.length} activities to mock`);
      
      // 2. ดึงนิสิตทั้งหมดจากระบบ
      const studentsResult = await this.dataSource!.query(
        `SELECT students_id FROM students ORDER BY students_id`
      );
      
      if (studentsResult.length === 0) {
        throw new Error("No students found in system");
      }
      
      console.log(`👥 Total students in system: ${studentsResult.length}`);
      
      const results = [];
      
      // 3. Loop แต่ละกิจกรรม
      for (const activity of activitiesResult) {
        try {
          console.log(`\n🎯 Processing activity ${activity.activity_id}: ${activity.activity_name}`);
          console.log(`   Seat: ${activity.seat}, Format: ${activity.event_format}`);
          
          // ตรวจสอบว่ามีการลงทะเบียนอยู่แล้วหรือไม่
          const existingCount = await this.dataSource!.query(
            `SELECT COUNT(*) as count FROM activity_detail WHERE activity_id = $1`,
            [activity.activity_id]
          );
          
          if (existingCount[0].count > 0) {
            console.log(`   ⚠️ Activity already has ${existingCount[0].count} registrations, skipping...`);
            results.push({
              activityId: activity.activity_id,
              activityName: activity.activity_name,
              status: 'skipped',
              reason: 'Already has registrations'
            });
            continue;
          }
          
          const numToRegister = activity.seat; // ลงทะเบียนเต็มจำนวน
          
          // สุ่มนิสิตที่จะลงทะเบียน
          const shuffledStudents = [...studentsResult].sort(() => Math.random() - 0.5);
          const studentsToRegister = shuffledStudents.slice(0, Math.min(numToRegister, studentsResult.length));
          
          // คำนวณจำนวนนิสิตที่จะไม่มี time_in/time_out (< 5%)
          const maxMissing = Math.floor(studentsToRegister.length * 0.05);
          const numMissing = Math.floor(Math.random() * (maxMissing + 1));
          
          console.log(`   📊 Will register ${studentsToRegister.length} students (${numMissing} incomplete)`);
          
          // สุ่มเลือกนิสิตที่จะไม่มี time_in/time_out
          const missingIndices = new Set<number>();
          while (missingIndices.size < numMissing) {
            missingIndices.add(Math.floor(Math.random() * studentsToRegister.length));
          }
          
          const queryRunner = this.dataSource!.createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();
          
          try {
            let withComplete = 0;
            let withoutComplete = 0;
            
            for (let i = 0; i < studentsToRegister.length; i++) {
              const student = studentsToRegister[i];
              const isMissing = missingIndices.has(i);
              
              // สร้าง activity_detail
              const activityDetailResult = await queryRunner.query(
                `INSERT INTO activity_detail (activity_id, activity_food_id, register_date, time_in, time_out, status)
                 VALUES ($1, NULL, NOW(), NULL, NULL, 'Registered')
                 RETURNING activity_detail_id`,
                [activity.activity_id]
              );
              
              const activityDetailId = activityDetailResult[0].activity_detail_id;
              
              // สร้าง join record
              await queryRunner.query(
                `INSERT INTO "join" (students_id, activity_detail_id, join_date, status)
                 VALUES ($1, $2, NOW(), 'Pending')`,
                [student.students_id, activityDetailId]
              );
              
              // กำหนด time_in และ time_out
              let timeIn = null;
              let timeOut = null;
              
              if (!isMissing) {
                // นิสิตปกติ: มีทั้ง time_in และ time_out
                const startDate = new Date(activity.start_activity_date);
                const endDate = new Date(activity.end_activity_date);
                
                // time_in: สุ่มภายใน 15 นาทีหลัง start_activity_date
                const timeInOffset = Math.floor(Math.random() * 16); // 0-15 นาที
                timeIn = new Date(startDate.getTime() + timeInOffset * 60000);
                
                // time_out: สุ่มระหว่าง time_in + 30 นาที ถึง end_activity_date
                const minTimeOut = new Date(timeIn.getTime() + 30 * 60000);
                const maxTimeOutTime = endDate.getTime();
                const minTimeOutTime = minTimeOut.getTime();
                
                if (maxTimeOutTime > minTimeOutTime) {
                  const timeOutOffset = Math.floor(Math.random() * (maxTimeOutTime - minTimeOutTime));
                  timeOut = new Date(minTimeOutTime + timeOutOffset);
                } else {
                  timeOut = minTimeOut;
                }
                
                withComplete++;
              } else {
                // นิสิตที่ไม่สมบูรณ์: สุ่มว่าจะเป็นแบบไหน
                const missingType = Math.random();
                
                if (missingType < 0.33) {
                  // ไม่มีทั้ง time_in และ time_out (ไม่มาเลย)
                  timeIn = null;
                  timeOut = null;
                } else if (missingType < 0.66) {
                  // มี time_in แต่ไม่มี time_out (มาแต่ออกก่อนเวลา)
                  const startDate = new Date(activity.start_activity_date);
                  const timeInOffset = Math.floor(Math.random() * 16);
                  timeIn = new Date(startDate.getTime() + timeInOffset * 60000);
                  timeOut = null;
                } else {
                  // มี time_out แต่ไม่มี time_in (ไม่ได้เช็คอิน แต่เช็คเอาท์)
                  timeIn = null;
                  const endDate = new Date(activity.end_activity_date);
                  timeOut = new Date(endDate.getTime() - Math.floor(Math.random() * 30) * 60000);
                }
                
                withoutComplete++;
              }
              
              // Update activity_detail ด้วย time_in และ time_out
              await queryRunner.query(
                `UPDATE activity_detail 
                 SET time_in = $1, time_out = $2
                 WHERE activity_detail_id = $3`,
                [timeIn, timeOut, activityDetailId]
              );
            }
            
            // อัพเดท registered_count
            await queryRunner.query(
              `UPDATE activity SET registered_count = $1 WHERE activity_id = $2`,
              [studentsToRegister.length, activity.activity_id]
            );
            
            await queryRunner.commitTransaction();
            
            console.log(`   ✅ Success: ${withComplete} complete, ${withoutComplete} incomplete`);
            
            results.push({
              activityId: activity.activity_id,
              activityName: activity.activity_name,
              status: 'success',
              registered: studentsToRegister.length,
              complete: withComplete,
              incomplete: withoutComplete
            });
          } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error(`   ❌ Error for activity ${activity.activity_id}:`, error);
            results.push({
              activityId: activity.activity_id,
              activityName: activity.activity_name,
              status: 'error',
              error: error instanceof Error ? error.message : String(error)
            });
          } finally {
            await queryRunner.release();
          }
        } catch (error) {
          console.error(`❌ Error processing activity ${activity.activity_id}:`, error);
          results.push({
            activityId: activity.activity_id,
            activityName: activity.activity_name,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      const successCount = results.filter(r => r.status === 'success').length;
      const skippedCount = results.filter(r => r.status === 'skipped').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      console.log(`\n🎉 [mockAllActivityRegistrations] Completed!`);
      console.log(`   ✅ Success: ${successCount}`);
      console.log(`   ⚠️ Skipped: ${skippedCount}`);
      console.log(`   ❌ Error: ${errorCount}`);
      
      return {
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          skipped: skippedCount,
          error: errorCount
        },
        details: results
      };
    } catch (error) {
      console.error("❌ [mockAllActivityRegistrations] Error:", error);
      this.logDbError("mockAllActivityRegistrations", error);
      throw error;
    }
  }

  /**
   * สร้างกิจกรรมจำนวนมากพร้อมกัน (Bulk Create)
   */
  public async bulkCreateActivities(
    activities: Partial<Activity>[],
    foodIdsArray: number[][] = []
  ): Promise<{ created: Activity[]; errors: any[] }> {
    await this.checkConnection();

    const queryRunner = this.dataSource!.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const created: Activity[] = [];
    const errors: any[] = [];

    try {
      console.log(`📦 [bulkCreateActivities] Starting bulk create for ${activities.length} activities`);

      for (let i = 0; i < activities.length; i++) {
        const data = activities[i];
        const foodIds = foodIdsArray[i] || [];

        try {
          console.log(`🔄 [bulkCreateActivities] Creating activity ${i + 1}/${activities.length}: ${data.activity_name}`);

          // Insert Activity
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
              this.sanitizeDate(data.special_start_register_date) || null,
              this.sanitizeDate(data.start_register_date) || null,
              this.sanitizeDate(data.end_register_date) || null,
              this.sanitizeDate(data.start_activity_date) || null,
              this.sanitizeDate(data.end_activity_date) || null,
              this.sanitizeDate(data.start_assessment) || null,
              this.sanitizeDate(data.end_assessment) || null,
              data.image_url || "ไม่ระบุ",
              data.activity_status || "Private",
              data.activity_state || "Not Start",
              data.status || "Active",
              // ✅ ถ้าเป็น Onsite และไม่มี url ให้เป็น null แทน "ไม่ระบุ"
              data.event_format === "Onsite" 
                ? (data.url && data.url.trim() !== "" ? data.url : null)
                : (data.url || "ไม่ระบุ"),
              data.room_id ?? null,
              data.assessment_id ?? null,
              new Date(),
            ]
          );

          const newActivity: Activity = result[0];

          // Insert ActivityFood if provided
          if (foodIds.length > 0) {
            const validFoodIds = foodIds.filter((foodId) => foodId > 0);

            if (validFoodIds.length > 0) {
              const values = validFoodIds
                .map((foodId) => `(${newActivity.activity_id}, ${foodId})`)
                .join(", ");
              await queryRunner.query(
                `INSERT INTO activity_food (activity_id, food_id) VALUES ${values}`
              );
              console.log(`✅ [bulkCreateActivities] Added ${validFoodIds.length} foods to activity ${newActivity.activity_id}`);
            }
          }

          created.push(newActivity);
          console.log(`✅ [bulkCreateActivities] Created activity ${i + 1}/${activities.length}: ${newActivity.activity_name} (ID: ${newActivity.activity_id})`);
        } catch (error) {
          console.error(`❌ [bulkCreateActivities] Error creating activity ${i + 1}:`, error);
          errors.push({
            index: i,
            activity_name: data.activity_name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      await queryRunner.commitTransaction();
      console.log(`✅ [bulkCreateActivities] Bulk create completed: ${created.length} created, ${errors.length} errors`);

      return { created, errors };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logDbError("bulkCreateActivities", error);
      throw new Error("❌ Failed to bulk create activities");
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ตรวจสอบและสร้างข้อมูล Assessment Structure ตัวอย่าง
   */
  public async checkAndCreateSampleAssessmentData(activityId: number): Promise<any> {
    try {
      await this.checkConnection();
      
      // ตรวจสอบว่า Activity มี assessment_version_id หรือไม่
      const activityQuery = `
        SELECT 
          activity_id,
          activity_name,
          assessment_id,
          assessment_version_id
        FROM activity
        WHERE activity_id = $1
      `;
      
      const activityResult = await this.dataSource!.query(activityQuery, [activityId]);
      
      if (activityResult.length === 0) {
        return { error: "Activity not found" };
      }
      
      const activity = activityResult[0];
      console.log(`🔍 Activity ${activityId} data:`, activity);
      
      if (!activity.assessment_version_id) {
        console.log(`⚠️ Activity ${activityId} has no assessment_version_id`);
        
        // สร้าง Assessment และ AssessmentVersion ตัวอย่าง
        const createAssessmentQuery = `
          INSERT INTO assessment (assessment_name, description, created_at)
          VALUES ($1, $2, NOW())
          RETURNING assessment_id
        `;
        
        const assessmentResult = await this.dataSource!.query(createAssessmentQuery, [
          `แบบประเมินสำหรับ ${activity.activity_name}`,
          "แบบประเมินผลการอบรม"
        ]);
        
        const assessmentId = assessmentResult[0].assessment_id;
        console.log(`✅ Created assessment with ID: ${assessmentId}`);
        
        // สร้าง AssessmentVersion
        const createVersionQuery = `
          INSERT INTO assessment_version (assessment_id, version_no, is_published, created_at)
          VALUES ($1, 1, true, NOW())
          RETURNING assessment_version_id
        `;
        
        const versionResult = await this.dataSource!.query(createVersionQuery, [assessmentId]);
        const versionId = versionResult[0].assessment_version_id;
        console.log(`✅ Created assessment version with ID: ${versionId}`);
        
        // อัปเดต Activity ให้เชื่อมกับ AssessmentVersion
        const updateActivityQuery = `
          UPDATE activity 
          SET assessment_id = $1, assessment_version_id = $2
          WHERE activity_id = $3
        `;
        
        await this.dataSource!.query(updateActivityQuery, [assessmentId, versionId, activityId]);
        console.log(`✅ Updated activity ${activityId} with assessment data`);
        
        // สร้าง SetNumber ตัวอย่าง
        const setNumbers = [
          { name: "ประเมินผลเนื้อหาการอบรม", description: "ประเมินความรู้และความเข้าใจ" },
          { name: "ประเมินวิทยากร", description: "ประเมินความสามารถของวิทยากร" }
        ];
        
        for (let i = 0; i < setNumbers.length; i++) {
          const setNumber = setNumbers[i];
          const createSetNumberQuery = `
            INSERT INTO set_number_version (assessment_version_id, order_index, name, description, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING set_number_version_id
          `;
          
          const setNumberResult = await this.dataSource!.query(createSetNumberQuery, [
            versionId, i + 1, setNumber.name, setNumber.description
          ]);
          
          const setNumberId = setNumberResult[0].set_number_version_id;
          console.log(`✅ Created set number "${setNumber.name}" with ID: ${setNumberId}`);
          
          // สร้าง Questions ตัวอย่าง
          const questions = i === 0 ? [
            { text: "ความรู้ความเข้าใจในเรื่องนี้ก่อนการอบรม", type: "single_choice" },
            { text: "ความรู้ความเข้าใจในเรื่องนี้หลังการอบรม", type: "single_choice" },
            { text: "ท่านได้รับความรู้แนวคิด ประสบการณ์ใหม่จากโครงการ", type: "single_choice" },
            { text: "ท่านสามารถนำสิ่งที่ได้รับจากโครงการนี้ไปใช้ประโยชน์ในการปฏิบัติงานในอนาคต", type: "single_choice" },
            { text: "รูปแบบและวิธีอบรมมีความเหมาะสมกับสถานการณ์ปัจจุบัน", type: "single_choice" }
          ] : [
            { text: "ความรู้ความเชี่ยวชาญในเรื่องบรรยายของวิทยากร", type: "single_choice" },
            { text: "ความสามารถในการบรรยายและถ่ายทอดความรู้ของวิทยากร", type: "single_choice" },
            { text: "ความสามารถในการถ่ายทอดเนื้อหาให้เป็นที่น่าสนใจ", type: "single_choice" },
            { text: "เปิดโอกาสให้มีส่วนร่วมในการสอบถามและแสดงความคิดเห็น", type: "single_choice" },
            { text: "ภาพรวมของการบรรยายมีความชัดเจน", type: "single_choice" }
          ];
          
          for (let j = 0; j < questions.length; j++) {
            const question = questions[j];
            const createQuestionQuery = `
              INSERT INTO question_version (set_number_version_id, order_index, question_text, question_type)
              VALUES ($1, $2, $3, $4)
              RETURNING question_version_id
            `;
            
            const questionResult = await this.dataSource!.query(createQuestionQuery, [
              setNumberId, j + 1, question.text, question.type
            ]);
            
            const questionId = questionResult[0].question_version_id;
            console.log(`✅ Created question "${question.text}" with ID: ${questionId}`);
            
            // สร้าง Choices ตัวอย่าง (Likert Scale)
            const choices = [
              "มากที่สุด",
              "มาก", 
              "ปานกลาง",
              "น้อย",
              "น้อยที่สุด"
            ];
            
            for (let k = 0; k < choices.length; k++) {
              const createChoiceQuery = `
                INSERT INTO choice_version (question_version_id, order_index, choice_text)
                VALUES ($1, $2, $3)
              `;
              
              await this.dataSource!.query(createChoiceQuery, [
                questionId, k + 1, choices[k]
              ]);
            }
            
            console.log(`✅ Created ${choices.length} choices for question ${questionId}`);
          }
        }
        
        return {
          success: true,
          message: `Created sample assessment data for activity ${activityId}`,
          assessment_id: assessmentId,
          assessment_version_id: versionId
        };
      } else {
        return {
          success: true,
          message: `Activity ${activityId} already has assessment_version_id: ${activity.assessment_version_id}`,
          assessment_version_id: activity.assessment_version_id
        };
      }
    } catch (error) {
      console.error("❌ Error checking and creating sample assessment data:", error);
      throw error;
    }
  }

  /**
   * 🔄 Reset การทำแบบประเมินของนิสิตในกิจกรรม
   */
  public async resetAssessmentForActivity(activityId: number): Promise<{
    studentsAffected: number;
    answersDeleted: number;
    joinsReset: number;
    hoursReset: number;
  }> {
    try {
      await this.checkConnection();
      
      console.log(`🔄 [ActivityDao] Starting reset assessment for activity ${activityId}...`);
      
      const queryRunner = this.dataSource!.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      try {
        // 1️⃣ หานิสิตที่ทำแบบประเมินแล้วและข้อมูลกิจกรรม
        const studentsQuery = `
          SELECT DISTINCT 
            s.students_id,
            s.soft_hours,
            s.hard_hours,
            a.type as activity_type,
            a.recieve_hours,
            a.assessment_id,
            j.join_id
          FROM activity a
          INNER JOIN assessment asm ON a.assessment_id = asm.assessment_id
          INNER JOIN activity_detail ad ON a.activity_id = ad.activity_id
          INNER JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
          INNER JOIN students s ON j.students_id = s.students_id
          WHERE a.activity_id = $1 
            AND j.status = 'Completed'
        `;
        
        const studentsResult = await queryRunner.query(studentsQuery, [activityId]);
        console.log(`📊 Found ${studentsResult.length} students who completed assessment`);
        
        if (studentsResult.length === 0) {
          await queryRunner.commitTransaction();
          return {
            studentsAffected: 0,
            answersDeleted: 0,
            joinsReset: 0,
            hoursReset: 0
          };
        }
        
        const assessmentId = studentsResult[0]?.assessment_id;
        const activityType = studentsResult[0]?.activity_type;
        const receiveHours = studentsResult[0]?.recieve_hours || 0;
        
        console.log(`🔍 Activity info:`, {
          assessmentId,
          activityType,
          receiveHours
        });
        
        // 2️⃣ ลบคำตอบทั้งหมดของนิสิตในกิจกรรม
        const deleteAnswersQuery = `
          DELETE FROM answer 
          WHERE assessment_id = $1
            AND join_id IN (
              SELECT j.join_id 
              FROM "join" j
              INNER JOIN activity_detail ad ON j.activity_detail_id = ad.activity_detail_id
              WHERE ad.activity_id = $2
            )
          RETURNING answer_id
        `;
        
        const deletedAnswers = await queryRunner.query(deleteAnswersQuery, [assessmentId, activityId]);
        console.log(`🗑️ Deleted ${deletedAnswers.length} answers`);
        
        // 3️⃣ Reset join status เป็น Pending
        const resetJoinQuery = `
          UPDATE "join" 
          SET status = 'Pending' 
          WHERE activity_detail_id IN (
            SELECT activity_detail_id 
            FROM activity_detail 
            WHERE activity_id = $1
          ) 
          AND status = 'Completed'
          RETURNING join_id
        `;
        
        const resetJoins = await queryRunner.query(resetJoinQuery, [activityId]);
        console.log(`🔄 Reset ${resetJoins.length} join statuses to Pending`);
        
        // 4️⃣ ลบชั่วโมงสหกิจที่ได้รับ
        let hoursReset = 0;
        
        if (receiveHours > 0) {
          for (const student of studentsResult) {
            const currentSoftHours = student.soft_hours || 0;
            const currentHardHours = student.hard_hours || 0;
            
            console.log(`👤 Student ${student.students_id}:`, {
              currentSoftHours,
              currentHardHours,
              activityType,
              receiveHours
            });
            
            if (activityType.toLowerCase() === 'soft' && currentSoftHours >= receiveHours) {
              // ลด soft_hours
              await queryRunner.query(
                `UPDATE students SET soft_hours = soft_hours - $1 WHERE students_id = $2`,
                [receiveHours, student.students_id]
              );
              hoursReset++;
              console.log(`✅ Reduced soft_hours for student ${student.students_id}: ${currentSoftHours} - ${receiveHours} = ${currentSoftHours - receiveHours}`);
            } else if (activityType.toLowerCase() === 'hard' && currentHardHours >= receiveHours) {
              // ลด hard_hours
              await queryRunner.query(
                `UPDATE students SET hard_hours = hard_hours - $1 WHERE students_id = $2`,
                [receiveHours, student.students_id]
              );
              hoursReset++;
              console.log(`✅ Reduced hard_hours for student ${student.students_id}: ${currentHardHours} - ${receiveHours} = ${currentHardHours - receiveHours}`);
            } else {
              console.log(`⚠️ Cannot reduce hours for student ${student.students_id} (insufficient hours)`);
            }
          }
        }
        
        await queryRunner.commitTransaction();
        
        const result = {
          studentsAffected: studentsResult.length,
          answersDeleted: deletedAnswers.length,
          joinsReset: resetJoins.length,
          hoursReset: hoursReset
        };
        
        console.log(`✅ Reset assessment completed for activity ${activityId}:`, result);
        return result;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error(`❌ Error during reset assessment transaction:`, error);
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error("❌ Error resetting assessment for activity:", error);
      this.logDbError("resetAssessmentForActivity", error);
      throw error;
    }
  }

  // ✅ เพิ่ม methods สำหรับลบ related records
  public async deleteActivityFoods(activityId: number): Promise<void> {
    await this.checkConnection();
    try {
      console.log("🗑️ [ActivityDao] Deleting activity_food records for activity:", activityId);
      await this.dataSource!.query(
        "DELETE FROM activity_food WHERE activity_id = $1",
        [activityId]
      );
      console.log("✅ [ActivityDao] Deleted activity_food records");
    } catch (error) {
      console.error("❌ [ActivityDao] Error deleting activity_food records:", error);
      throw error;
    }
  }

  public async deleteActivityDetails(activityId: number): Promise<void> {
    await this.checkConnection();
    try {
      console.log("🗑️ [ActivityDao] Deleting activity_detail records for activity:", activityId);
      await this.dataSource!.query(
        "DELETE FROM activity_detail WHERE activity_id = $1",
        [activityId]
      );
      console.log("✅ [ActivityDao] Deleted activity_detail records");
    } catch (error) {
      console.error("❌ [ActivityDao] Error deleting activity_detail records:", error);
      throw error;
    }
  }

  public async deleteCertificateTemplate(activityId: number): Promise<void> {
    await this.checkConnection();
    try {
      console.log("🗑️ [ActivityDao] Deleting certificate base for activity:", activityId);
      
      // ✅ ลบโดยใช้ activity_id โดยตรง (เพราะ certificate_base มี FK ไปหา activity)
      const result = await this.dataSource!.query(
        "DELETE FROM certificate_base WHERE activity_id = $1 RETURNING certificate_base_id",
        [activityId]
      );
      
      if (result.length > 0) {
        console.log("✅ [ActivityDao] Deleted certificate base:", result[0].certificate_base_id);
      } else {
        console.log("ℹ️ [ActivityDao] No certificate base found for activity:", activityId);
      }
    } catch (error) {
      console.error("❌ [ActivityDao] Error deleting certificate template:", error);
      throw error;
    }
  }

  public async deleteQrCodes(activityId: number): Promise<void> {
    await this.checkConnection();
    try {
      console.log("🗑️ [ActivityDao] Deleting qr_code records for activity:", activityId);
      
      // ลบ qr_code records ที่อ้างอิง activity_id
      const result = await this.dataSource!.query(
        "DELETE FROM qr_code WHERE activity_id = $1",
        [activityId]
      );
      
      console.log("✅ [ActivityDao] Deleted qr_code records for activity:", activityId);
    } catch (error) {
      console.error("❌ [ActivityDao] Error deleting qr_code records:", error);
      throw error;
    }
  }

}