import pool from "../../db/database";
import { User } from "../../interfaces/User";

export class UserDao {
  async getAllUsers(): Promise<User[]> {
    const { rows } = await pool.query(`SELECT * FROM users ORDER BY users_id`);
    return rows;
  }

  async getUserById(users_id: number): Promise<User | null> {
    const { rows } = await pool.query(`SELECT * FROM users WHERE users_id = $1`, [users_id]);
    return rows[0] || null;
  }
}
