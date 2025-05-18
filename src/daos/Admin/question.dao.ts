import pool from "../../db/database";
import { Question } from "../../interfaces/Question";

export class QuestionDao {
  async getAllQuestions(): Promise<Question[]> {
    const { rows } = await pool.query(`SELECT * FROM question ORDER BY question_id`);
    return rows;
  }

  async getQuestionById(question_id: number): Promise<Question | null> {
    const { rows } = await pool.query(`SELECT * FROM question WHERE question_id = $1`, [question_id]);
    return rows[0] || null;
  }
}
