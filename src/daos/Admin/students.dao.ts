import pool from "../../db/database";
import { Students } from "../../interfaces/Students";

export class StudentsDao {
  async getAllStudents(): Promise<Students[]> {
    const { rows } = await pool.query(`SELECT * FROM students ORDER BY students_id`);
    return rows;
  }

  async getStudentById(students_id: number): Promise<Students | null> {
    const { rows } = await pool.query(`SELECT * FROM students WHERE students_id = $1`, [students_id]);
    return rows[0] || null;
  }
}
