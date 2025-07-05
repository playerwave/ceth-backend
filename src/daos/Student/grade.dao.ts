import { DataSource } from "typeorm";
import { Grade } from "../../entity/grade.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class GradeDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ GradeDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  public async countGrade(): Promise<number> {
    this.checkConnection();
    try {
      const sql = `SELECT COUNT(*) FROM grade`;
      const result = await this.dataSource!.query(sql);
      return result[0].count;
    } catch (error) {
      this.logDbError("countGrade", error);
      throw error;
    }
  }

  public async getGrade(): Promise<Grade[]> {
    this.checkConnection();
    try {
      const sql = `SELECT * FROM grade ORDER BY grade_id DESC`;
      const result = await this.dataSource!.query(sql);
      return result;
    } catch (error) {
      this.logDbError("getGrade", error);
      throw error;
    }
  }
}
