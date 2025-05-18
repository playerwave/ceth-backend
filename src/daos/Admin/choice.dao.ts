import pool from "../../db/database";
import { Choice } from "../../interfaces/Choice";

export class ChoiceDao {
  async getAllChoices(): Promise<Choice[]> {
    const { rows } = await pool.query(`SELECT * FROM choice ORDER BY choice_id`);
    return rows;
  }

  async getChoiceById(choice_id: number): Promise<Choice | null> {
    const { rows } = await pool.query(`SELECT * FROM choice WHERE choice_id = $1`, [choice_id]);
    return rows[0] || null;
  }
}
