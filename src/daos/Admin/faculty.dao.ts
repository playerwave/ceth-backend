import pool from "../../db/database";
import { Faculty } from "../../interfaces/Faculty";

export class FacultyDao {
  async getAllFaculties(): Promise<Faculty[]> {
    const query = `SELECT * FROM faculty ORDER BY faculty_id`;
    const { rows } = await pool.query(query);
    return rows;
  }

  async getFacultyById(faculty_id: number): Promise<Faculty | null> {
    const query = `SELECT * FROM faculty WHERE faculty_id = $1`;
    const { rows } = await pool.query(query, [faculty_id]);
    return rows[0] || null;
  }
}
