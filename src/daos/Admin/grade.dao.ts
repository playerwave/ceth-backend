import pool from "../../db/database";
import { Grade } from "../../interfaces/Grade";

export class GradeDao {
  async getAllGrades(): Promise<Grade[]> {
    const { rows } = await pool.query(`SELECT * FROM grade ORDER BY grade_id`);
    return rows;
  }

  async getGradeById(grade_id: number): Promise<Grade | null> {
    const { rows } = await pool.query(`SELECT * FROM grade WHERE grade_id = $1`, [grade_id]);
    return rows[0] || null;
  }
}
