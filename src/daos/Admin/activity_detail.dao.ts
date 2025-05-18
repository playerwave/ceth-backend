import pool from "../../db/database";
import { ActivityDetail } from "../../interfaces/ActivityDetail";

export class ActivityDetailDao {
  async getAllActivityDetails(): Promise<ActivityDetail[]> {
    const { rows } = await pool.query(`SELECT * FROM activity_detail ORDER BY activity_detail_id`);
    return rows;
  }

  async getActivityDetailById(activity_detail_id: number): Promise<ActivityDetail | null> {
    const { rows } = await pool.query(`SELECT * FROM activity_detail WHERE activity_detail_id = $1`, [activity_detail_id]);
    return rows[0] || null;
  }
}
