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
      this.dataSource = await connectDatabase();
      console.log("✅ StudentActivityDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  // 🔹 กิจกรรมทั้งหมดที่นักศึกษายังไม่ได้สมัคร (public, active, ไม่หมดเวลา)
  public async getAvailableActivities(studentId: number): Promise<Activity[]> {
    this.checkConnection();

    // const query = `
    //   SELECT a.*
    //   FROM activity a
    //   WHERE a.activity_status = 'Public'
    //     AND a.status = 'Active'
    //     AND NOT EXISTS (
    //       SELECT 1 FROM join j
    //       WHERE j.activity_id = a.activity_id
    //         AND j.student_id = $1
    //     )
    //   ORDER BY a.create_activity_date DESC
    // `;

    const query = `
  SELECT a.*
  FROM activity a
  WHERE a.activity_status = 'Public'
    AND a.status = 'Active'
    AND NOT EXISTS (
      SELECT 1
      FROM activity_detail ad
      JOIN "join" j ON ad.activity_detail_id = j.activity_detail_id
      WHERE ad.activity_id = a.activity_id
        AND j.students_id = $1
    )
  ORDER BY a.create_activity_date DESC
`;

    const result = await this.dataSource!.query(query, [studentId]);
    return result;
  }

  // 🔹 ดึงกิจกรรมตาม ID พร้อมบอกว่านักศึกษาเคย join หรือยัง
  public async findActivityWithJoinStatus(
    activityId: number,
    studentId: number | null
  ): Promise<Activity | null> {
    this.checkConnection();

    const query = `
      SELECT a.*,
        CASE WHEN j.join_id IS NOT NULL THEN true ELSE false END AS is_joined
      FROM activity a
      LEFT JOIN join j ON a.activity_id = j.activity_id
        AND j.student_id = $1
      WHERE a.activity_id = $2
    `;

    const result = await this.dataSource!.query(query, [
      studentId ?? -1,
      activityId,
    ]);
    return result[0] ?? null;
  }

  // 🔹 ดึงกิจกรรมที่นักศึกษาเคยสมัครไว้แล้ว
  public async getEnrolledActivities(studentId: number): Promise<Activity[]> {
    this.checkConnection();

    const query = `
      SELECT a.*
      FROM activity a
      INNER JOIN join j ON j.activity_id = a.activity_id
      WHERE j.student_id = $1
      ORDER BY a.start_activity_date DESC
    `;

    const result = await this.dataSource!.query(query, [studentId]);
    return result;
  }

  // 🔹 ค้นหากิจกรรมจากชื่อ (เฉพาะ public, active)
  public async searchActivitiesByName(ac_name: string): Promise<Activity[]> {
    this.checkConnection();

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
}
