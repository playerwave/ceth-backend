import pool from "../../db/database";
import { Roles } from "../../interfaces/Roles";

export class RolesDao {
  async getAllRoles(): Promise<Roles[]> {
    const query = `SELECT * FROM roles ORDER BY roles_id`;
    const { rows } = await pool.query(query);
    return rows;
  }

  async getRoleById(roles_id: number): Promise<Roles | null> {
    const query = `SELECT * FROM roles WHERE roles_id = $1`;
    const { rows } = await pool.query(query, [roles_id]);
    return rows[0] || null;
  }
}
