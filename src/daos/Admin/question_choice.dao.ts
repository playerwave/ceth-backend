import pool from "../../db/database";
import { QuestionChoice } from "../../interfaces/QuestionChoice";

export class QuestionChoiceDao {
  async getAllQuestionChoices(): Promise<QuestionChoice[]> {
    const { rows } = await pool.query(`SELECT * FROM question_choice ORDER BY question_choice_id`);
    return rows;
  }

  async getQuestionChoiceById(id: number): Promise<QuestionChoice | null> {
    const { rows } = await pool.query(`SELECT * FROM question_choice WHERE question_choice_id = $1`, [id]);
    return rows[0] || null;
  }
}
