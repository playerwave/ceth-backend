import { DataSource } from "typeorm";
import { Grade } from "../../entity/grade.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class GradeDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
  }

  private async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing GradeDao...");
      this.dataSource = await connectDatabase();
      console.log("✅ GradeDao initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize GradeDao:", error);
      this.logDbError("initialize", error);
      throw error;
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.dataSource?.isConnected) {
      console.log(
        "🔄 Database connection not established, attempting to initialize..."
      );
      try {
        await this.initialize();
      } catch (error) {
        throw new Error(`❌ Database connection is not established: ${error}`);
      }
    }
  }

  public async getGrades(): Promise<Grade[]> {
    await this.checkConnection();
    try {
      const sql = `SELECT grade_id, level, description, created_at, updated_at FROM grade ORDER BY grade_id ASC`;
      return await this.dataSource!.query(sql);
    } catch (error) {
      this.logDbError("getGrades", error);
      throw error;
    }
  }

  public async countGrades(): Promise<number> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query("SELECT COUNT(*) FROM grade");
      return result[0].count;
    } catch (error) {
      this.logDbError("countGrades", error);
      throw error;
    }
  }

  public async createGrade(level: string, description?: string): Promise<Grade> {
    await this.checkConnection();
    try {
      const sql = `INSERT INTO grade (level, description, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *`;
      const result = await this.dataSource!.query(sql, [level, description]);
      return result[0];
    } catch (error) {
      this.logDbError("createGrade", error);
      throw error;
    }
  }

  public async getGradeById(grade_id: number): Promise<Grade | null> {
    await this.checkConnection();
    try {
      const sql = `SELECT grade_id, level, description, created_at, updated_at FROM grade WHERE grade_id = $1`;
      const result = await this.dataSource!.query(sql, [grade_id]);
      return result[0] || null;
    } catch (error) {
      this.logDbError("getGradeById", error);
      throw error;
    }
  }

  public async updateGrade(grade_id: number, level?: string, description?: string): Promise<Grade | null> {
    await this.checkConnection();
    try {
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

      updates.push(`updated_at = NOW()`);
      values.push(grade_id);

      const sql = `UPDATE grade SET ${updates.join(", ")} WHERE grade_id = $${paramIndex} RETURNING *`;
      const result = await this.dataSource!.query(sql, values);
      return result[0] || null;
    } catch (error) {
      this.logDbError("updateGrade", error);
      throw error;
    }
  }

  public async deleteGrade(grade_id: number): Promise<boolean> {
    await this.checkConnection();
    try {
      const sql = `DELETE FROM grade WHERE grade_id = $1`;
      const result = await this.dataSource!.query(sql, [grade_id]);
      return result.rowCount > 0;
    } catch (error) {
      this.logDbError("deleteGrade", error);
      throw error;
    }
  }

  public async getGradeByLevel(level: string): Promise<Grade | null> {
    await this.checkConnection();
    try {
      const sql = `SELECT grade_id, level, description, created_at, updated_at FROM grade WHERE level = $1`;
      const result = await this.dataSource!.query(sql, [level]);
      return result[0] || null;
    } catch (error) {
      this.logDbError("getGradeByLevel", error);
      throw error;
    }
  }
}
