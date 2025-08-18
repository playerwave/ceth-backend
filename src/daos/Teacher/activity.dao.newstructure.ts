import { DataSource } from "typeorm";
import { Activity } from "../../entity/activity.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";
import { formatTimeToLocal, add7Hours } from "../../utils/formatTimeToLocal";

export type TransitionResult = {
  notStartToSpecial: number;
  notStartToOpen: number;
  specialToOpen: number;
  openToClose: number;
  closeToStart: number;
  startToEnd: number;
  endToStartAssess: number;
  startAssessToEnd: number;
  updatedIds: {
    notStartToSpecial: number[];
    notStartToOpen: number[];
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

  private formatDateToLocalString(date: Date): string {
    // ✅ ใช้ formatTimeToLocal utility แทนการแปลงเอง
    return formatTimeToLocal(date, "Asia/Bangkok");
  }

  private sanitizeDate(input: unknown): string | null {
    // ✅ ถ้าเป็น null หรือ empty string ให้ return null
    if (input === null || input === undefined || input === "") {
      return null;
    }

    if (input instanceof Date) {
      // ✅ บวก 7 ชั่วโมงก่อนบันทึก
      return add7Hours(this.formatDateToLocalString(input));
    }

    if (typeof input === "string" && input.trim() !== "") {
      const parsed = new Date(input);
      if (isNaN(parsed.getTime())) {
        // ✅ ถ้า parse ไม่ได้ ให้ return null
        return null;
      } else {
        // ✅ บวก 7 ชั่วโมงก่อนบันทึก
        return add7Hours(this.formatDateToLocalString(parsed));
      }
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

    const activities = await this.dataSource!.getRepository(Activity).find({
      where: { status: "Active" }, // ดึงเฉพาะที่ยังไม่ soft delete
      order: { create_activity_date: "DESC" },
    });

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

        // ✅ จัดการ date fields ให้บวก 7 ชั่วโมงก่อนบันทึก
        if (value instanceof Date) {
          return add7Hours(this.formatDateToLocalString(value));
        }

        // ✅ จัดการ date fields ที่เป็น string ให้บวก 7 ชั่วโมงก่อนบันทึก
        if (
          typeof value === "string" &&
          value.trim() !== "" &&
          (field.includes("_date") || field.includes("_assessment"))
        ) {
          return add7Hours(value);
        }

        // ✅ จัดการ null หรือ empty string สำหรับ date fields
        if (
          (value === null || value === "" || value === undefined) &&
          (field.includes("_date") || field.includes("_assessment"))
        ) {
          return null;
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
        `UPDATE activity SET ${setClause} WHERE activity_id = $${
          updateFields.length + 1
        }`,
        [...values, activity_id]
      );

      // ✅ ลบข้อมูลอาหารเดิม
      await queryRunner.query(
        `DELETE FROM activity_food WHERE activity_id = $1`,
        [activity_id]
      );

      // ✅ เพิ่มข้อมูลอาหารใหม่ (ถ้ามี)
      if (foodIds.length > 0) {
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

    const result = await this.dataSource!.getRepository(Activity).findOne({
      where: { activity_id: id },
      relations: ["activityFood", "activityFood.food"], // 👈 ดึง relation มาด้วย
    });

    // ✅ Log ข้อมูลอาหารที่ดึงออกมา
    if (result && result.activityFood) {
      console.log("🍽️ Activity foods found:", result.activityFood.length);
      result.activityFood.forEach((af, index) => {
        console.log(`🍽️ Food ${index + 1}:`, {
          activity_food_id: af.activity_food_id,
          food_id: af.food_id,
          food_name: af.food?.food_name,
        });
      });
    } else {
      console.log("🍽️ No foods found for activity:", id);
    }

    // ✅ Log ข้อมูลที่ดึงออกมาจาก Database
    if (result) {
      console.log("🔍 === FIND BY ID - DATA FROM DATABASE ===");
      console.log(
        "📅 special_start_register_date:",
        result.special_start_register_date
      );
      console.log("📅 start_register_date:", result.start_register_date);
      console.log("📅 end_register_date:", result.end_register_date);
      console.log("📅 start_activity_date:", result.start_activity_date);
      console.log("📅 end_activity_date:", result.end_activity_date);
      console.log("📅 start_assessment:", result.start_assessment);
      console.log("📅 end_assessment:", result.end_assessment);
      console.log("⏰ recieve_hours:", result.recieve_hours);
      console.log("🏢 room_id:", result.room_id);
      console.log("📊 assessment_id:", result.assessment_id);
      console.log("🔍 === END LOG ===");
    }

    return result;
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
    const debugQuery = `SELECT activity_id, activity_name, activity_state, status FROM activity WHERE status = 'Active' LIMIT 5`;
    const debugResult = await this.dataSource!.query(debugQuery);
    console.log(`🔍 [advanceStatesOnce] Current activities in DB:`, debugResult);
    
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
  
    // ✅ แก้ไข: ใช้เวลาไทย (UTC+7) แทน UTC
    const nowRef = freezeNow ?? new Date();
    const thaiTime = new Date(nowRef.getTime() + (7 * 60 * 60 * 1000)); // เพิ่ม 7 ชั่วโมง
    console.log(`🕐 [advanceStatesOnce] UTC time:`, nowRef.toISOString());
    console.log(`🕐 [advanceStatesOnce] Thai time:`, thaiTime.toISOString());
  
    const run = async (sql: string, params: unknown[]): Promise<number[]> => {
      const rows: Array<{ activity_id: number }> = await qr.query(sql, params);
      console.log(`🔍 [advanceStatesOnce] Query result:`, rows);
      console.log(`🔍 [advanceStatesOnce] SQL:`, sql);
      console.log(`🔍 [advanceStatesOnce] Params:`, params);
      
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
            $1::timestamp < start_activity_date as start_activity_check
          FROM activity 
          WHERE activity_state = 'Open Register' 
        AND status = 'Active'
            AND end_register_date IS NOT NULL
        `;
        const timeCheckResult = await qr.query(timeCheckQuery, params);
        console.log(`🔍 [advanceStatesOnce] Time comparison check:`, timeCheckResult);
      }
      
      // ✅ ตรวจสอบว่า rows เป็น array หรือไม่
      const safeRows = Array.isArray(rows) ? rows : [];
      const ids = safeRows.map((r) => r.activity_id);
      console.log(`🔍 [advanceStatesOnce] Extracted IDs:`, ids);
      return ids;
    };
  
    try {
      // 1) Not Start -> Special Open Register
      const ids1 = await run(
        `
        UPDATE activity
           SET activity_state = 'Special Open Register',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Not Start'
           AND special_start_register_date IS NOT NULL
           AND $1::timestamp >= special_start_register_date
           AND (start_register_date IS NULL OR $1::timestamp < start_register_date)
        RETURNING activity_id
        `,
        [thaiTime]
      );
  
      // 2) Not Start -> Open Register
      const ids2 = await run(
        `
        UPDATE activity
           SET activity_state = 'Open Register',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Not Start'
           AND start_register_date IS NOT NULL
           AND $1::timestamp >= start_register_date
           AND (end_register_date IS NULL OR $1::timestamp < end_register_date)
        RETURNING activity_id
        `,
        [thaiTime]
      );
  
      // 3) Special Open Register -> Open Register
      const ids3 = await run(
        `
        UPDATE activity
           SET activity_state = 'Open Register',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Special Open Register'
           AND start_register_date IS NOT NULL
           AND $1::timestamp >= start_register_date
           AND (end_register_date IS NULL OR $1::timestamp < end_register_date)
        RETURNING activity_id
        `,
        [thaiTime]
      );
  
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
        [thaiTime]
      );

      // 5) Close Register -> Start Activity
      const ids5 = await run(
        `
        UPDATE activity
           SET activity_state = 'Start Activity',
               last_update_activity_date = $1::timestamp
         WHERE status = 'Active'
           AND activity_state = 'Close Register'
           AND start_activity_date IS NOT NULL
           AND $1::timestamp >= start_activity_date
                      AND (end_activity_date IS NULL OR $1::timestamp < end_activity_date)
        RETURNING activity_id
        `,
        [thaiTime]
      );

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
        [thaiTime]
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
        [thaiTime]
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
        [thaiTime]
      );
  
      await qr.commitTransaction();
      return {
        notStartToSpecial: ids1.length,
        notStartToOpen: ids2.length,
        specialToOpen: ids3.length,
        openToClose: ids4.length,
        closeToStart: ids5.length,
        startToEnd: ids6.length,
        endToStartAssess: ids7.length,
        startAssessToEnd: ids8.length,
        updatedIds: {
          notStartToSpecial: ids1,
          notStartToOpen: ids2,
          specialToOpen: ids3,
          openToClose: ids4,
          closeToStart: ids5,
          startToEnd: ids6,
          endToStartAssess: ids7,
          startAssessToEnd: ids8,
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
        SELECT * FROM activity 
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
