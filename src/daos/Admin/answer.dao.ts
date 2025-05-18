import pool from "../../db/database";
import { Answer } from "../../interfaces/Answer";

export class AnswerDao {
  async getAllAnswers(): Promise<Answer[]> {
    const { rows } = await pool.query(`SELECT * FROM answer ORDER BY choose_id`);
    return rows;
  }

  async getAnswerById(choose_id: number): Promise<Answer | null> {
    const { rows } = await pool.query(`SELECT * FROM answer WHERE choose_id = $1`, [choose_id]);
    return rows[0] || null;
  }
}
