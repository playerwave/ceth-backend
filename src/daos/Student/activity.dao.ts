import { DataSource } from "typeorm";
import { Activity } from "../../entity/activity.entity";
import { Join } from "../../entity/join.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

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

  // 🔹 กิจกรรมทั้งหมดที่นักศึกษายังไม่ได้สมัคร (public, active, ไม่หมดเวลา)
  //   public async getAvailableActivities(studentId: number): Promise<Activity[]> {
  //     this.checkConnection();

  //     const query = `
  //   SELECT a.*
  //   FROM activity a
  //   WHERE a.activity_status = 'Public'
  //     AND a.status = 'Active'
  //     AND NOT EXISTS (
  //       SELECT 1
  //       FROM activity_detail ad
  //       JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
  //       WHERE ad.activity_id = a.activity_id
  //         AND j.students_id = $1
  //     )
  //   ORDER BY a.create_activity_date DESC
  // `;

  //     const result = await this.dataSource!.query(query, [studentId]);
  //     return result;
  //   }

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
      // ✅ สำหรับ Risk: เห็นกิจกรรมที่ถึง special_start_register_date แล้ว และยังไม่เกิน end_register_date
      query = `
        SELECT a.*
        FROM activity a
        WHERE a.activity_status = 'Public'
          AND a.status = 'Active'
          AND a.activity_state IN ('Special Open Register', 'Open Register')
          AND a.special_start_register_date <= NOW()
          AND a.end_register_date > NOW()
          AND (
            SELECT COUNT(*)
            FROM activity_detail ad
            JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
            WHERE ad.activity_id = a.activity_id
          ) < a.seat
          AND NOT EXISTS (
            SELECT 1
            FROM activity_detail ad
            JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
            WHERE ad.activity_id = a.activity_id
              AND j.students_id = $1
          )
        ORDER BY a.create_activity_date DESC
      `;
    } else {
      // ✅ สำหรับ Normal: เห็นกิจกรรมที่ถึง start_register_date แล้ว และยังไม่เกิน end_register_date
      query = `
        SELECT a.*
        FROM activity a
        WHERE a.activity_status = 'Public'
          AND a.status = 'Active'
          AND a.activity_state = 'Open Register'
          AND a.start_register_date <= NOW()
          AND a.end_register_date > NOW()
          AND (
            SELECT COUNT(*)
            FROM activity_detail ad
            JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
            WHERE ad.activity_id = a.activity_id
          ) < a.seat
          AND NOT EXISTS (
            SELECT 1
            FROM activity_detail ad
            JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
            WHERE ad.activity_id = a.activity_id
              AND j.students_id = $1
          )
        ORDER BY a.create_activity_date DESC
      `;
    }

    params = [studentId];
    const result = await this.dataSource!.query(query, params);

    console.log(
      `📊 Found ${result.length} available activities for student ${studentId} (risk_status: ${riskStatus})`
    );
    return result;
  }

  // 🔹 ดึงกิจกรรมที่นักศึกษาเคยสมัครไว้แล้ว
  // public async getEnrolledActivities(studentId: number): Promise<Activity[]> {
  //   this.checkConnection();

  //   const query = `
  //     SELECT a.*
  //     FROM activity a
  //     INNER JOIN join j ON j.activity_id = a.activity_id
  //     WHERE j.student_id = $1
  //     ORDER BY a.start_activity_date DESC
  //   `;

  //   const result = await this.dataSource!.query(query, [studentId]);
  //   return result;
  // }

  public async getEnrolledActivities(studentId: number): Promise<Activity[]> {
    await this.checkConnection();

    const query = `
      SELECT a.*
      FROM activity a
      INNER JOIN activity_detail ad ON ad.activity_id = a.activity_id
      INNER JOIN "join" j ON j.activity_detail_id = ad.activity_detail_id
      WHERE j.students_id = $1
        AND a.activity_status = 'Public'
      ORDER BY a.start_activity_date DESC
    `;

    const result = await this.dataSource!.query(query, [studentId]);
    return result;
  }

  // 🔹 ค้นหากิจกรรมจากชื่อ (เฉพาะ public, active)
  public async searchActivitiesByName(ac_name: string): Promise<Activity[]> {
    await this.checkConnection();

    const query = `
      SELECT *
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
            CASE WHEN j.join_id IS NOT NULL THEN true ELSE false END AS is_joined
          FROM activity a
          LEFT JOIN "join" j ON a.activity_id = j.activity_id
            AND j.students_id = $1
          WHERE a.activity_id = $2
        `;
      params = [studentId, activityId];
    } else {
      query = `
    SELECT a.*, false AS is_joined
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

  // public async getActivityDetailIdByActivityId(
  //   activityId: number
  // ): Promise<{ activity_detail_id: number } | null> {
  //   this.checkConnection();
  //   const result = await this.dataSource!.query(
  //     `SELECT activity_detail_id FROM activity_detail WHERE activity_id = $1 LIMIT 1`,
  //     [activityId]
  //   );
  //   return result[0] ?? null;
  // }

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

  // public async createJoin(
  //   studentId: number,
  //   activityId: number,
  //   teacherId: number // ต้องส่ง teacherId มาด้วย
  // ): Promise<Join> {
  //   this.checkConnection();

  //   // 1. หา activity_detail_id จาก activity_id
  //   const activityDetailResult = await this.dataSource!.query(
  //     `SELECT activity_detail_id FROM activity_detail WHERE activity_id = $1 LIMIT 1`,
  //     [activityId]
  //   );
  //   const activityDetailId = activityDetailResult[0]?.activity_detail_id;
  //   if (!activityDetailId) throw new Error("Activity detail not found");

  //   // 2. สร้างข้อมูล join (ลงทะเบียนกิจกรรม)
  //   const result = await this.dataSource!.query(
  //     `INSERT INTO "join" (students_id, activity_detail_id, teacher_id, join_date, status)
  //      VALUES ($1, $2, $3, $4, $5)
  //      RETURNING *`,
  //     [
  //       studentId,
  //       activityDetailId,
  //       teacherId,
  //       new Date(), // join_date เป็น timestamp
  //       "Pending", // หรือ 'Completed', 'Cancelled' ตามต้องการ
  //     ]
  //   );
  //   return result[0];
  // }

  public async createActivityDetail(
    activityId: number,
    joinId: number,
    foodChoices: string[]
  ): Promise<{ activity_detail_id: number }> {
    await this.checkConnection();

    // สร้าง activity_detail record
    const result = await this.dataSource!.query(
      `INSERT INTO activity_detail (activity_id, join_id, register_date, status)
       VALUES ($1, $2, $3, $4)
       RETURNING activity_detail_id`,
      [
        activityId,
        joinId,
        new Date(), // register_date
        "Registered", // status
      ]
    );
    return result[0];
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

  public async createActivityDetailOnly(
    activityId: number
  ): Promise<{ activity_detail_id: number }> {
    await this.checkConnection();
    const result = await this.dataSource!.query(
      `INSERT INTO activity_detail (activity_id, register_date, status)
       VALUES ($1, $2, $3)
       RETURNING activity_detail_id`,
      [activityId, new Date(), "Registered"]
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
}
