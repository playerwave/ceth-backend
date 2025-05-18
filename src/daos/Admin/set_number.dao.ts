import pool from "../../db/database";
import { SetNumber } from "../../interfaces/SetNumber";

export class SetNumberDao {
  async getAllSetNumbers(): Promise<SetNumber[]> {
    const { rows } = await pool.query(`SELECT * FROM set_number ORDER BY set_number_id`);
    return rows;
  }

  async getSetNumberById(id: number): Promise<SetNumber | null> {
    const { rows } = await pool.query(`SELECT * FROM set_number WHERE set_number_id = $1`, [id]);
    return rows[0] || null;
  }
}
