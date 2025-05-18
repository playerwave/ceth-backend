import pool from "../../db/database";
import { Teacher } from "../../interfaces/Teacher";

export class TeacherDao {
  async getAllTeachers(): Promise<Teacher[]> {
    const { rows } = await pool.query(`SELECT * FROM teacher ORDER BY teacher_id`);
    return rows;
  }

  async getTeacherById(teacher_id: number): Promise<Teacher | null> {
    const { rows } = await pool.query(`SELECT * FROM teacher WHERE teacher_id = $1`, [teacher_id]);
    return rows[0] || null;
  }
}
