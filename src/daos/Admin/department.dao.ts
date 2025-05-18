import pool from "../../db/database";
import { Department } from "../../interfaces/Department";

export class DepartmentDao {
  async getAllDepartments(): Promise<Department[]> {
    const query = `SELECT * FROM department ORDER BY department_id`;
    const { rows } = await pool.query(query);
    return rows;
  }

  async getDepartmentById(department_id: number): Promise<Department | null> {
    const query = `SELECT * FROM department WHERE department_id = $1`;
    const { rows } = await pool.query(query, [department_id]);
    return rows[0] || null;
  }
}
