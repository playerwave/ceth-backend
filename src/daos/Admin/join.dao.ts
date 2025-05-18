import pool from "../../db/database";
import { Join } from "../../interfaces/Join";

export class JoinDao {
  async getAllJoins(): Promise<Join[]> {
    const { rows } = await pool.query(`SELECT * FROM join ORDER BY join_id`);
    return rows;
  }

  async getJoinById(id: number): Promise<Join | null> {
    const { rows } = await pool.query(`SELECT * FROM join WHERE join_id = $1`, [id]);
    return rows[0] || null;
  }
}
