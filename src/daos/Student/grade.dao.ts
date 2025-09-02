import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";
import { Grade } from "../../entity/grade.entity";

export class GradeDao extends ErrorHandledDao {

  public async getGrades(): Promise<Grade[]> {
    try {
      const connection = await connectDatabase();
      const sql = `SELECT grade_id, level, description FROM grade ORDER BY grade_id ASC`;
      return await connection.query(sql);
    } catch (error) {
      this.logDbError("getGrades", error);
      throw error;
    }
  }

  public async countGrades(): Promise<number> {
    try {
      const connection = await connectDatabase();
      const result = await connection.query("SELECT COUNT(*) FROM grade");
      return result[0].count;
    } catch (error) {
      this.logDbError("countGrades", error);
      throw error;
    }
  }

  public async createGrade(level: string, description?: string): Promise<Grade> {
    try {
      const connection = await connectDatabase();
      const sql = `INSERT INTO grade (level, description) VALUES ($1, $2) RETURNING *`;
      const result = await connection.query(sql, [level, description]);
      return result[0];
    } catch (error) {
      this.logDbError("createGrade", error);
      throw error;
    }
  }

  public async getGradeById(grade_id: number): Promise<Grade | null> {
    try {
      const connection = await connectDatabase();
      const sql = `SELECT grade_id, level, description FROM grade WHERE grade_id = $1`;
      const result = await connection.query(sql, [grade_id]);
      return result[0] || null;
    } catch (error) {
      this.logDbError("getGradeById", error);
      throw error;
    }
  }

  public async updateGrade(grade_id: number, level?: string, description?: string): Promise<Grade | null> {
    try {
      const connection = await connectDatabase();
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (level !== undefined) {
        updates.push(`level = $${paramIndex++}`);
        values.push(level);
      }

      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }

      if (updates.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(grade_id);

      const sql = `UPDATE grade SET ${updates.join(", ")} WHERE grade_id = $${paramIndex} RETURNING *`;
      const result = await connection.query(sql, values);
      return result[0] || null;
    } catch (error) {
      this.logDbError("updateGrade", error);
      throw error;
    }
  }

  public async deleteGrade(grade_id: number): Promise<boolean> {
    try {
      const connection = await connectDatabase();
      const sql = `DELETE FROM grade WHERE grade_id = $1`;
      const result = await connection.query(sql, [grade_id]);
      return result.rowCount > 0;
    } catch (error) {
      this.logDbError("deleteGrade", error);
      throw error;
    }
  }

  public async getGradeByLevel(level: string): Promise<Grade | null> {
    try {
      const connection = await connectDatabase();
      const sql = `SELECT grade_id, level, description FROM grade WHERE level = $1`;
      const result = await connection.query(sql, [level]);
      return result[0] || null;
    } catch (error) {
      this.logDbError("getGradeByLevel", error);
      throw error;
    }
  }
}
