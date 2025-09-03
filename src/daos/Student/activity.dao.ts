import { DataSource } from "typeorm";
import { Activity } from "../../entity/activity.entity";
import { Join } from "../../entity/join.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";
import bcrypt from "bcryptjs";

export class ActivityDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing StudentActivityDao...");
      this.dataSource = await connectDatabase();
      console.log("✅ StudentActivityDao initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize StudentActivityDao:", error);
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

  public async getActivityHistoryByStudentsID(students_id: number): Promise<Activity[]> {
    await this.checkConnection();
    try {
      const sql = `SELECT ac.activity_id, ac.activity_name, ac.presenter_company_name, ac.type, ac.description, ac.seat, ac.recieve_hours, ac.event_format, ac.start_activity_date, ac.end_activity_date, ac.image_url, ac.activity_state, r.room_name, asm.assessment_name, ac.start_assessment, ac.end_assessment, ac.registered_count FROM students as st INNER JOIN "join" as j ON st.students_id = j.students_id INNER JOIN activity_detail as acd ON j.activity_detail_id = acd.activity_detail_id INNER JOIN activity as ac ON acd.activity_id = ac.activity_id INNER JOIN room as r ON ac.room_id = r.room_id INNER JOIN assessment as asm ON ac.assessment_id = asm.assessment_id WHERE ((((ac.event_format = 'Online' OR ac.event_format = 'Onsite') AND ac.activity_state = 'End Assessment') OR (ac.event_format = 'Course' AND ac.activity_state = 'End Activity')) AND (st.students_id = $1)) ORDER BY ac.activity_id ASC`
      const result = await this.dataSource?.query(sql, [students_id]);
      return result
    } catch (error) {
      this.logDbError("getActivityHistoryByStudentsID", error);
      throw new Error("❌ Failed to update activity");
    }
  }

  public async getSearch(students_id: number, text: string): Promise<Activity[]> {
    await this.checkConnection();
    try {
      const Text1 = text
      const Text2 = `%${text}%`
      const sql = `SELECT ac.activity_id, ac.activity_name, ac.presenter_company_name, ac.type, ac.description, ac.seat, ac.recieve_hours, ac.event_format, ac.start_activity_date, ac.end_activity_date, ac.image_url, ac.activity_state, r.room_name, asm.assessment_name, ac.start_assessment, ac.end_assessment, ac.registered_count, GREATEST(similarity(ac.activity_name, $1), similarity(ac.presenter_company_name, $1), similarity(ac.type::text, $1)) AS relevance FROM students as st INNER JOIN "join" as j ON st.students_id = j.students_id INNER JOIN activity_detail as acd ON j.activity_detail_id = acd.activity_detail_id INNER JOIN activity as ac ON acd.activity_id = ac.activity_id INNER JOIN room as r ON ac.room_id = r.room_id INNER JOIN assessment as asm ON ac.assessment_id = asm.assessment_id WHERE ((ac.activity_name ILIKE $2 OR ac.presenter_company_name ILIKE $2 OR ac.type::text ILIKE $2) AND st.students_id = $3) ORDER BY relevance DESC`
      const result = await this.dataSource?.query(sql, [Text1, Text2, students_id]);
      return result;
    } catch (error) {
      this.logDbError("getSearch", error);
      throw new Error("❌ Failed to Search getSearch");
    }
  }


  public async getAvailableActivities(studentId: number): Promise<Activity[]> {
    await this.checkConnection();

    // ✅ ดึงข้อมูล risk_status ของนิสิต
    const studentQuery = `
      SELECT s.risk_status
      FROM students s
      WHERE s.users_id = $1
    `;
    const studentResult = await this.dataSource!.query(studentQuery, [
      studentId,
    ]);
    const riskStatus = studentResult[0]?.risk_status || "Normal";

    // ✅ สร้าง query ตาม risk_status
    let query: string;
    let params: any[];

    if (riskStatus === "Risk") {
      // ✅ สำหรับ Risk: เห็นกิจกรรมที่มี activity_state ที่เหมาะสม
      query = `
        SELECT a.*, COALESCE(a.registered_count, 0) as registered_count
        FROM activity a
        WHERE a.activity_status = 'Public'
          AND a.status = 'Active'
          AND (
            (a.activity_state IN ('Special Open Register', 'Open Register')
             AND COALESCE(a.registered_count, 0) < a.seat)
            OR
            (a.event_format = 'Course' AND a.activity_state = 'Start Activity')
          )
          AND NOT EXISTS (
            SELECT 1
            FROM activity_detail ad
            JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
            WHERE ad.activity_id = a.activity_id
              AND j.students_id = $1
              AND ad.status = 'Registered'
          )
        ORDER BY a.create_activity_date DESC
      `;
    } else {
      // ✅ สำหรับ Normal: เห็นกิจกรรมที่มี activity_state ที่เหมาะสม
      query = `
        SELECT a.*, COALESCE(a.registered_count, 0) as registered_count
        FROM activity a
        WHERE a.activity_status = 'Public'
          AND a.status = 'Active'
          AND (
            (a.activity_state = 'Open Register'
             AND COALESCE(a.registered_count, 0) < a.seat)
            OR
            (a.event_format = 'Course' AND a.activity_state = 'Start Activity')
          )
          AND NOT EXISTS (
            SELECT 1
            FROM activity_detail ad
            JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
            WHERE ad.activity_id = a.activity_id
              AND j.students_id = $1
              AND ad.status = 'Registered'
          )
        ORDER BY a.create_activity_date DESC
      `;
    }

    params = [studentId];

    // ✅ Debug: ตรวจสอบกิจกรรมทั้งหมดที่ตรงเงื่อนไขพื้นฐาน
    const debugQuery = `
      SELECT a.activity_id, a.activity_name, a.activity_state, a.event_format, a.seat,
             a.start_register_date, a.end_register_date, a.special_start_register_date,
             NOW() as current_time,
             (
               SELECT COUNT(*)
               FROM activity_detail ad
               JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
               WHERE ad.activity_id = a.activity_id
             ) as enrolled_count,
             EXISTS (
               SELECT 1
               FROM activity_detail ad
               JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
               WHERE ad.activity_id = a.activity_id
                 AND j.students_id = $1
             ) as already_enrolled
      FROM activity a
      WHERE a.activity_status = 'Public'
        AND a.status = 'Active'
        AND (
          a.activity_state IN ('Special Open Register', 'Open Register')
          OR (a.event_format = 'Course' AND a.activity_state = 'Start Activity')
        )
      ORDER BY a.create_activity_date DESC
    `;
    const debugResult = await this.dataSource!.query(debugQuery, [studentId]);
    console.log(`🔍 [DEBUG] All matching activities for student ${studentId}:`, debugResult);

    // ✅ Debug: แสดงเวลาปัจจุบันที่ใช้ใน query
    const timeQuery = `SELECT NOW() as current_db_time, CURRENT_TIMESTAMP as current_timestamp, NOW() + INTERVAL '7 hours' as thai_time`;
    const timeResult = await this.dataSource!.query(timeQuery);
    console.log(`🕐 [DEBUG] Current time used in query:`, timeResult[0]);

    const result = await this.dataSource!.query(query, params);

    console.log(
      `📊 Found ${result.length} available activities for student ${studentId} (risk_status: ${riskStatus})`
    );
    return result;
  }

  public async getEnrolledActivities(studentId: number): Promise<Activity[]> {
    await this.checkConnection();

    const query = `
      SELECT a.*, COALESCE(a.registered_count, 0) as registered_count
      FROM activity a
      INNER JOIN activity_detail ad ON ad.activity_id = a.activity_id
      INNER JOIN "join" j ON j.activity_detail_id = ad.activity_detail_id
      WHERE j.students_id = $1
        AND a.activity_status = 'Public'
        AND ad.status = 'Registered'
        AND j.status = 'Pending'
      ORDER BY a.start_activity_date DESC
    `;

    const result = await this.dataSource!.query(query, [studentId]);
    console.log(`📊 Found ${result.length} enrolled activities for student ${studentId} (Registered status, Pending join)`);
    return result;
  }

  public async getOngoingActivities(studentId: number): Promise<Activity[]> {
    await this.checkConnection();

    // Debug: ตรวจสอบข้อมูลทั้งหมดของนักเรียนก่อน
    const debugQuery = `
      SELECT a.activity_id, a.activity_name, a.activity_state, a.activity_status,
             ad.status as detail_status, j.status as join_status
      FROM activity a
      INNER JOIN activity_detail ad ON ad.activity_id = a.activity_id
      INNER JOIN "join" j ON j.activity_detail_id = ad.activity_detail_id
      WHERE j.students_id = $1
      ORDER BY a.activity_id
    `;
    const debugResult = await this.dataSource!.query(debugQuery, [studentId]);
    console.log(`🔍 [DEBUG] All activities for student ${studentId}:`, debugResult);

    const query = `
      SELECT a.*, COALESCE(a.registered_count, 0) as registered_count
      FROM activity a
      INNER JOIN activity_detail ad ON ad.activity_id = a.activity_id
      INNER JOIN "join" j ON j.activity_detail_id = ad.activity_detail_id
      WHERE j.students_id = $1
        AND ad.status = 'Registered'
        AND j.status = 'Pending'
        AND a.activity_state IN ('Start Activity', 'End Activity')
      ORDER BY a.start_activity_date DESC
    `;

    const result = await this.dataSource!.query(query, [studentId]);
    console.log(`📊 Found ${result.length} ongoing activities for student ${studentId} (Start Activity or End Activity state)`);
    
    if (result.length > 0) {
      console.log(`🔍 [DEBUG] Ongoing activities details:`, result.map((r: any) => ({
        activity_id: r.activity_id,
        activity_name: r.activity_name,
        activity_state: r.activity_state
      })));
    }
    
    return result;
  }

  // 🔹 ค้นหากิจกรรมจากชื่อ (เฉพาะ public, active)
  public async searchActivitiesByName(ac_name: string): Promise<Activity[]> {
    await this.checkConnection();

    const query = `
      SELECT *, COALESCE(registered_count, 0) as registered_count
      FROM activity
      WHERE activity_status = 'Public'
        AND status = 'Active'
        AND activity_name ILIKE $1
      ORDER BY create_activity_date DESC
    `;

    const result = await this.dataSource!.query(query, [`%${ac_name}%`]);
    return result;
  }

  public async findActivityWithJoinStatus(
    activityId: number,
    studentId?: number | null
  ): Promise<Activity | null> {
    await this.checkConnection();

    let query: string;
    let params: any[];

    if (studentId) {
      query = `
          SELECT a.*,
            CASE WHEN j.join_id IS NOT NULL THEN true ELSE false END AS is_joined,
            COALESCE(a.registered_count, 0) as registered_count
          FROM activity a
          LEFT JOIN "join" j ON a.activity_id = j.activity_id
            AND j.students_id = $1
          WHERE a.activity_id = $2
        `;
      params = [studentId, activityId];
    } else {
      query = `
    SELECT a.*, false AS is_joined, COALESCE(a.registered_count, 0) as registered_count
    FROM activity a
    WHERE a.activity_id = $1
  `;
      params = [activityId];
    }

    const result = await this.dataSource!.query(query, params);
    return result[0] ?? null;
  }

  public async findJoinByStudentAndActivity(
    studentId: number,
    activityDetailId: number // ต้องเป็น activity_detail_id
  ): Promise<Join | null> {
    await this.checkConnection();

    try {
      const result = await this.dataSource!.getRepository(Join).findOne({
        where: {
          students_id: studentId,
          activity_detail_id: activityDetailId,
        },
      });
      return result;
    } catch (error) {
      this.logDbError("findJoinByStudentAndActivity", error);
      throw error;
    }
  }

  // เพิ่มเมธอดใหม่สำหรับหา join โดย activity_id และ students_id
  public async findJoinByStudentAndActivityId(
    studentId: number,
    activityId: number
  ): Promise<Join | null> {
    await this.checkConnection();

    const query = `
      SELECT j.*
      FROM "join" j
      INNER JOIN activity_detail ad ON j.activity_detail_id = ad.activity_detail_id
      WHERE j.students_id = $1
        AND ad.activity_id = $2
        AND ad.status = 'Registered'
        AND j.status = 'Pending'
      LIMIT 1
    `;

    const result = await this.dataSource!.query(query, [studentId, activityId]);
    return result[0] || null;
  }

  public async getActivityDetailIdByActivityId(
    activityId: number
  ): Promise<{ activity_detail_id: number } | null> {
    await this.checkConnection();

    // ลอง log activityId ที่รับเข้ามา (ช่วย debug)
    console.log(
      "[DAO] getActivityDetailIdByActivityId: activityId =",
      activityId
    );

    const result = await this.dataSource!.query(
      `SELECT activity_detail_id FROM activity_detail WHERE activity_id = $1 LIMIT 1`,
      [activityId]
    );

    if (!result[0]) {
      // เพิ่ม log error เพื่อช่วย debug
      console.error(
        `[DAO] ไม่พบ activity_detail_id สำหรับ activity_id = ${activityId}`
      );
      return null;
    }

    return result[0];
  }

  public async getAvailableActivityDetailId(
    activityId: number,
    studentId: number
  ): Promise<{ activity_detail_id: number } | null> {
    await this.checkConnection();
    const result = await this.dataSource!.query(
      `SELECT ad.activity_detail_id
       FROM activity_detail ad
       LEFT JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id AND j.students_id = $2
       WHERE ad.activity_id = $1 AND j.join_id IS NULL
       LIMIT 1`,
      [activityId, studentId]
    );
    if (!result[0]) {
      console.error(
        `[DAO] ไม่พบ activity_detail_id สำหรับ activity_id = ${activityId} และ students_id = ${studentId}`
      );
      return null;
    }
    return result[0];
  }

  public async createActivityDetail(
    activityId: number,
    studentId: number,
    foodChoices: string[]
  ): Promise<{ activity_detail_id: number }> {
    await this.checkConnection();

    // 0. ตรวจสอบว่า activity มีที่นั่งว่างหรือไม่
    const activityQuery = `
      SELECT seat, registered_count 
      FROM activity 
      WHERE activity_id = $1
    `;
    const activityResult = await this.dataSource!.query(activityQuery, [activityId]);
    const activity = activityResult[0];

    if (!activity) {
      throw new Error("Activity not found");
    }

    if (activity.registered_count >= activity.seat) {
      console.log(`❌ Activity ${activityId} is full: ${activity.registered_count}/${activity.seat}`);
      throw new Error("Activity is full");
    }

    console.log(`✅ Activity ${activityId} has available seats: ${activity.registered_count}/${activity.seat}`);

    // 0.5. ตรวจสอบว่านักเรียนลงทะเบียนกิจกรรมนี้แล้วหรือยัง
    const existingEnrollmentQuery = `
      SELECT ad.activity_detail_id, ad.status
      FROM activity_detail ad
      JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
      WHERE ad.activity_id = $1 AND j.students_id = $2
      LIMIT 1
    `;
    
    const existingEnrollment = await this.dataSource!.query(existingEnrollmentQuery, [activityId, studentId]);
    
    if (existingEnrollment.length > 0) {
      const enrollment = existingEnrollment[0];
      console.log(`✅ Found existing enrollment: activity_detail_id ${enrollment.activity_detail_id}, status: ${enrollment.status}`);
      
      // ถ้า status เป็น 'Cancelled' ให้อัพเดทเป็น 'Registered'
      if (enrollment.status === 'Cancelled') {
        console.log(`🔄 Updating cancelled activity_detail to Registered`);
        await this.dataSource!.query(
          `UPDATE activity_detail 
           SET status = 'Registered', register_date = NOW()
           WHERE activity_detail_id = $1`,
          [enrollment.activity_detail_id]
        );
        
        // อัพเดท join status เป็น 'Pending'
        await this.dataSource!.query(
          `UPDATE "join" 
           SET status = 'Pending'
           WHERE activity_detail_id = $1 AND students_id = $2`,
          [enrollment.activity_detail_id, studentId]
        );
        
        // อัพเดท registered_count หลังจากเปลี่ยน status
        await this.updateRegisteredCount(activityId);
      }
      
      return { activity_detail_id: enrollment.activity_detail_id };
    }

    // 1. สร้าง activity_food record สำหรับแต่ละ food choice
    let activityFoodId = null;
    if (foodChoices && foodChoices.length > 0) {
      // สร้าง activity_food record สำหรับ food แรก
      const firstFoodId = parseInt(foodChoices[0]);

      // ตรวจสอบว่า food_id มีอยู่จริงหรือไม่
      const foodExists = await this.dataSource!.query(
        `SELECT food_id FROM food WHERE food_id = $1`,
        [firstFoodId]
      );

      if (foodExists.length > 0) {
        // ตรวจสอบว่ามี activity_food record นี้อยู่แล้วหรือไม่
        const existingActivityFood = await this.dataSource!.query(
          `SELECT activity_food_id FROM activity_food WHERE activity_id = $1 AND food_id = $2`,
          [activityId, firstFoodId]
        );

        if (existingActivityFood.length > 0) {
          // ใช้ activity_food_id ที่มีอยู่แล้ว
          activityFoodId = existingActivityFood[0].activity_food_id;
          console.log(`✅ Using existing activity_food_id: ${activityFoodId}`);
        } else {
          // สร้าง activity_food record ใหม่
          const activityFoodResult = await this.dataSource!.query(
            `INSERT INTO activity_food (activity_id, food_id)
             VALUES ($1, $2)
             RETURNING activity_food_id`,
            [activityId, firstFoodId]
          );
          activityFoodId = activityFoodResult[0].activity_food_id;
          console.log(`✅ Created new activity_food_id: ${activityFoodId}`);
        }
      }
    }

    // ถ้าไม่มี food choices หรือ food_id ไม่มีอยู่ ให้สร้าง default activity_food record
    if (!activityFoodId) {
      // หา food_id แรกที่มีอยู่
      const firstFood = await this.dataSource!.query(
        `SELECT food_id FROM food LIMIT 1`
      );

      if (firstFood.length > 0) {
        // ตรวจสอบว่ามี activity_food record นี้อยู่แล้วหรือไม่
        const existingActivityFood = await this.dataSource!.query(
          `SELECT activity_food_id FROM activity_food WHERE activity_id = $1 AND food_id = $2`,
          [activityId, firstFood[0].food_id]
        );

        if (existingActivityFood.length > 0) {
          // ใช้ activity_food_id ที่มีอยู่แล้ว
          activityFoodId = existingActivityFood[0].activity_food_id;
          console.log(`✅ Using existing activity_food_id: ${activityFoodId}`);
        } else {
          // สร้าง activity_food record ใหม่
          const activityFoodResult = await this.dataSource!.query(
            `INSERT INTO activity_food (activity_id, food_id)
             VALUES ($1, $2)
             RETURNING activity_food_id`,
            [activityId, firstFood[0].food_id]
          );
          activityFoodId = activityFoodResult[0].activity_food_id;
          console.log(`✅ Created new activity_food_id: ${activityFoodId}`);
        }
      }
    }

    // 2. สร้าง activity_detail record ใหม่สำหรับนักเรียนคนนี้
    const result = await this.dataSource!.query(
      `INSERT INTO activity_detail (activity_id, activity_food_id, register_date, time_in, time_out, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING activity_detail_id`,
      [
        activityId,
        activityFoodId, // ใช้ activity_food_id ที่เพิ่งสร้าง
        new Date(), // register_date
        null, // time_in - ให้เป็น null ได้
        null, // time_out - ให้เป็น null ได้
        "Registered", // status
      ]
    );

    console.log(`✅ Created new activity_detail_id: ${result[0].activity_detail_id} for student ${studentId}`);

    // 3. สร้าง join record ใหม่สำหรับนักเรียนคนนี้
    const joinResult = await this.dataSource!.query(
      `INSERT INTO "join" (students_id, join_date, status, activity_detail_id)
       VALUES ($1, $2, $3, $4)
       RETURNING join_id`,
      [
        studentId,
        new Date(), // join_date
        "Pending", // status
        result[0].activity_detail_id // activity_detail_id ที่เพิ่งสร้าง
      ]
    );

    console.log(`✅ Created new join_id: ${joinResult[0].join_id} for student ${studentId}`);

    // อัพเดท registered_count หลังจากสร้าง activity_detail และ join
    await this.updateRegisteredCount(activityId);

    return result[0];
  }

  // เพิ่มเมธอดใหม่สำหรับอัพเดท registered_count
  public async updateRegisteredCount(activityId: number): Promise<void> {
    await this.checkConnection();

    // Debug: ตรวจสอบจำนวน activity_detail ที่มี status = 'Registered'
    const debugQuery = `
      SELECT COUNT(*) as registered_count
      FROM activity_detail
      WHERE activity_id = $1 AND status = 'Registered'
    `;
    const debugResult = await this.dataSource!.query(debugQuery, [activityId]);
    console.log(`🔍 [DEBUG] Found ${debugResult[0]?.registered_count || 0} registered activity_details for activity ${activityId}`);

    const updateQuery = `
      UPDATE activity 
      SET registered_count = (
        SELECT COUNT(*)
        FROM activity_detail
        WHERE activity_id = $1 AND status = 'Registered'
      )
      WHERE activity_id = $1
    `;

    await this.dataSource!.query(updateQuery, [activityId]);

    // Log เพื่อ debug
    const countQuery = `
      SELECT registered_count 
      FROM activity 
      WHERE activity_id = $1
    `;
    const countResult = await this.dataSource!.query(countQuery, [activityId]);
    console.log(`📊 Updated registered_count for activity ${activityId}: ${countResult[0]?.registered_count || 0}`);
  }

  // เพิ่มเมธอดสำหรับรีเซ็ต registered_count ทั้งหมด
  public async resetAllRegisteredCounts(): Promise<void> {
    await this.checkConnection();

    const resetQuery = `
      UPDATE activity 
      SET registered_count = (
        SELECT COUNT(*)
        FROM activity_detail ad
        WHERE ad.activity_id = activity.activity_id 
          AND ad.status = 'Registered'
      )
    `;

    await this.dataSource!.query(resetQuery);

    // Log สรุป
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_activities,
        SUM(COALESCE(registered_count, 0)) as total_registrations
      FROM activity
    `;
    const summaryResult = await this.dataSource!.query(summaryQuery);
    console.log(`🔄 Reset all registered_counts: ${summaryResult[0]?.total_activities || 0} activities, ${summaryResult[0]?.total_registrations || 0} total registrations`);
  }

  // เพิ่มเมธอด public สำหรับ query ข้อมูล activity
  public async getActivityInfo(activityId: number): Promise<{ registered_count: number; seat: number } | null> {
    await this.checkConnection();

    const query = `
      SELECT COALESCE(registered_count, 0) as registered_count, seat 
      FROM activity 
      WHERE activity_id = $1
    `;
    const result = await this.dataSource!.query(query, [activityId]);
    return result[0] || null;
  }

  public async createJoin(
    studentId: number,
    activityDetailId: number,
    foodChoices: string[]
  ): Promise<Join> {
    await this.checkConnection();
    const result = await this.dataSource!.query(
      `INSERT INTO "join" (students_id, activity_detail_id, join_date, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [studentId, activityDetailId, new Date(), "Pending"]
    );
    return result[0];
  }

  public async getJoinByActivityDetailAndStudent(
    activityDetailId: number,
    studentId: number
  ): Promise<Join | null> {
    await this.checkConnection();
    const result = await this.dataSource!.query(
      `SELECT * FROM "join" 
       WHERE activity_detail_id = $1 AND students_id = $2
       ORDER BY join_id DESC
       LIMIT 1`,
      [activityDetailId, studentId]
    );
    return result[0] || null;
  }

  // เพิ่มเมธอดสำหรับลบ activity_detail และอัพเดท registered_count
  public async deleteActivityDetailAndUpdateCount(activityDetailId: number): Promise<void> {
    await this.checkConnection();

    // 1. หา activity_id ก่อนลบ
    const activityQuery = `
      SELECT activity_id 
      FROM activity_detail 
      WHERE activity_detail_id = $1
    `;
    const activityResult = await this.dataSource!.query(activityQuery, [activityDetailId]);
    const activityId = activityResult[0]?.activity_id;

    if (!activityId) {
      console.warn(`⚠️ Activity detail ${activityDetailId} not found`);
      return;
    }

    // 2. ลบ activity_detail
    await this.dataSource!.query(
      `DELETE FROM activity_detail WHERE activity_detail_id = $1`,
      [activityDetailId]
    );

    // 3. อัพเดท registered_count
    await this.updateRegisteredCount(activityId);

    console.log(`🗑️ Deleted activity_detail ${activityDetailId} and updated registered_count for activity ${activityId}`);
  }

  public async createActivityDetailOnly(
    activityId: number
  ): Promise<{ activity_detail_id: number }> {
    await this.checkConnection();
    const result = await this.dataSource!.query(
      `INSERT INTO activity_detail (activity_id, register_date, time_in, time_out, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING activity_detail_id`,
      [activityId, new Date(), null, null, "Registered"]
    );
    return result[0];
  }

  public async updateActivityDetailWithFood(
    activityDetailId: number,
    foodChoices: string[]
  ): Promise<void> {
    await this.checkConnection();
    await this.dataSource!.query(
      `UPDATE activity_detail SET food_choices = $1 WHERE activity_detail_id = $2`,
      [foodChoices.join(","), activityDetailId]
    );
  }

  public async cancelEnrollment(
    studentId: number,
    activityId: number
  ): Promise<boolean> {
    await this.checkConnection();

    // หา activity_detail ของนิสิตในกิจกรรมนี้
    const detailRow = await this.dataSource!.query(
      `
      SELECT ad.activity_detail_id
      FROM activity_detail ad
      JOIN "join" j ON j.activity_detail_id = ad.activity_detail_id
      WHERE ad.activity_id = $1
        AND j.students_id = $2
        AND ad.status = 'Registered'
      LIMIT 1
      `,
      [activityId, studentId]
    );

    const activityDetailId: number | undefined = detailRow[0]?.activity_detail_id;
    if (!activityDetailId) {
      console.warn(`⚠️ Not found registered activity_detail for student=${studentId}, activity=${activityId}`);
      return false;
    }

    // เปลี่ยนสถานะเป็น Cancelled
    const updated = await this.dataSource!.query(
      `
      UPDATE activity_detail
      SET status = 'Cancelled'
      WHERE activity_detail_id = $1
        AND status = 'Registered'
      RETURNING activity_detail_id
      `,
      [activityDetailId]
    );

    // อัปเดตสถานะในตาราง join
    await this.dataSource!.query(
      `
      UPDATE "join"
      SET status = 'Cancelled'
      WHERE activity_detail_id = $1
      `,
      [activityDetailId]
    );

    // นับผู้ลงทะเบียนใหม่ (นับเฉพาะ Registered)
    await this.updateRegisteredCount(activityId);

    const success = Boolean(updated[0]);
    if (success) {
      console.log(`🚪 Cancelled enrollment for student=${studentId} from activity=${activityId} (detail=${activityDetailId})`);
    }
    return success;
  }

  // ✅ เมธอดใหม่: ตรวจสอบ username และ password ของนิสิต
  public async validateStudentCredentials(
    username: string,
    password: string
  ): Promise<{ students_id: number; username: string; first_name: string; last_name: string; department: string } | null> {
    await this.checkConnection();

    try {
      console.log(`🔍 [DAO] Validating credentials for username: ${username}`);
      
      // 1. หา user และ student โดย username พร้อมข้อมูลเพิ่มเติม
      const query = `
        SELECT s.students_id, u.username, u.password, s.first_name, s.last_name, d.department_name
        FROM students s
        INNER JOIN users u ON s.users_id = u.users_id
        LEFT JOIN department d ON s.department_id = d.department_id
        WHERE u.username = $1
        LIMIT 1
      `;
      
      const result = await this.dataSource!.query(query, [username]);
      console.log(`🔍 [DAO] User found:`, result.length > 0 ? 'Yes' : 'No');
      
      if (result[0]) {
        const user = result[0];
        console.log(`🔍 [DAO] Checking password for user: ${user.username}`);
        
        // 2. ตรวจสอบ password ด้วย bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`🔍 [DAO] Password valid:`, isPasswordValid);
        
        if (isPasswordValid) {
          console.log(`✅ [DAO] Credentials valid for student_id: ${user.students_id}`);
          return {
            students_id: user.students_id,
            username: user.username,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            department: user.department_name || 'ไม่ระบุ'
          };
        } else {
          console.log(`❌ [DAO] Password incorrect`);
          return null;
        }
      } else {
        console.log(`❌ [DAO] User not found`);
        return null;
      }
    } catch (error) {
      this.logDbError("validateStudentCredentials", error);
      throw error;
    }
  }

  // ✅ เมธอดใหม่: หา enrollment ของนิสิตในกิจกรรม
  public async findEnrollmentByStudentAndActivity(
    studentId: number,
    activityId: number
  ): Promise<{ activity_detail_id: number; time_in: Date | null; time_out: Date | null } | null> {
    await this.checkConnection();

    try {
      const query = `
        SELECT ad.activity_detail_id, ad.time_in, ad.time_out
        FROM activity_detail ad
        INNER JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
        WHERE ad.activity_id = $1
          AND j.students_id = $2
          AND ad.status = 'Registered'
          AND j.status = 'Pending'
        LIMIT 1
      `;
      
      const result = await this.dataSource!.query(query, [activityId, studentId]);
      return result[0] || null;
    } catch (error) {
      this.logDbError("findEnrollmentByStudentAndActivity", error);
      throw error;
    }
  }

  // ✅ เมธอดใหม่: อัพเดท time_in
  public async updateTimeIn(studentId: number, activityId: number): Promise<void> {
    await this.checkConnection();

    try {
      const query = `
        UPDATE activity_detail
        SET time_in = NOW() + INTERVAL '7 hours'
        WHERE activity_detail_id IN (
          SELECT ad.activity_detail_id
          FROM activity_detail ad
          INNER JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
          WHERE ad.activity_id = $1
            AND j.students_id = $2
            AND ad.status = 'Registered'
            AND j.status = 'Pending'
        )
      `;
      
      await this.dataSource!.query(query, [activityId, studentId]);
      console.log(`✅ Updated time_in for student ${studentId} in activity ${activityId}`);
    } catch (error) {
      this.logDbError("updateTimeIn", error);
      throw error;
    }
  }

  // ✅ เมธอดใหม่: อัพเดท time_out
  public async updateTimeOut(studentId: number, activityId: number): Promise<void> {
    await this.checkConnection();

    try {
      const query = `
        UPDATE activity_detail
        SET time_out = NOW() + INTERVAL '7 hours'
        WHERE activity_detail_id IN (
          SELECT ad.activity_detail_id
          FROM activity_detail ad
          INNER JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
          WHERE ad.activity_id = $1
            AND j.students_id = $2
            AND ad.status = 'Registered'
            AND j.status = 'Pending'
        )
      `;
      
      await this.dataSource!.query(query, [activityId, studentId]);
      console.log(`✅ Updated time_out for student ${studentId} in activity ${activityId}`);
    } catch (error) {
      this.logDbError("updateTimeOut", error);
      throw error;
    }
  }

  // ✅ เมธอดใหม่: อัพเดท join status
  public async updateJoinStatus(joinId: number, status: string): Promise<void> {
    await this.checkConnection();

    try {
      const query = `
        UPDATE "join"
        SET status = $1
        WHERE join_id = $2
      `;
      
      await this.dataSource!.query(query, [status, joinId]);
      console.log(`✅ Updated join status to ${status} for join_id: ${joinId}`);
    } catch (error) {
      this.logDbError("updateJoinStatus", error);
      throw error;
    }
  }

  // ✅ เมธอดใหม่: ดึงข้อมูล activity ตาม ID
  public async getActivityByID(activity_id: number): Promise<Activity[]> {
    await this.checkConnection();
    try {
      const sql = `SELECT * FROM activity WHERE activity_id = $1`;
      const result = await this.dataSource?.query(sql, [activity_id]);
      return result;
    } catch (error) {
      this.logDbError("getActivityByID", error);
      throw new Error("❌ Failed to get activity by ID");
    }
  }
}


