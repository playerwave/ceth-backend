import pool from "../../db/database";
import { QuestionType } from "../../interfaces/QuestionType";

export class QuestionTypeDao {
  async getAllQuestionTypes(): Promise<QuestionType[]> {
    const { rows } = await pool.query(`SELECT * FROM question_type ORDER BY question_type_id`);
    return rows;
  }

  async getQuestionTypeById(question_type_id: number): Promise<QuestionType | null> {
    const { rows } = await pool.query(`SELECT * FROM question_type WHERE question_type_id = $1`, [question_type_id]);
    return rows[0] || null;
  }
}
