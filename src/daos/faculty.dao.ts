import { DataSource } from "typeorm";
import { Faculty } from "../entity/faculty.entity";
import { connectDatabase } from "../db/database";
import { ErrorHandledDao } from "./error.handled.dao";

export class FacultyDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ FacultyDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  public async countFaculty(): Promise<number> {
    this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        "SELECT COUNT(*) FROM faculty"
      );
      return Number(result[0].count);
    } catch (error) {
      this.logDbError("countFaculty", error);
      throw error;
    }
  }

  public async getFaculty(page: number, limit: number): Promise<Faculty[]> {
    this.checkConnection();
    try {
      const offset = (page - 1) * limit;
      const sql = `SELECT * FROM faculty ORDER BY faculty_id ASC LIMIT $1 OFFSET $2`;
      const result = await this.dataSource!.query(sql, [limit, offset]);
      return result;
    } catch (error) {
      this.logDbError("getFaculty", error);
      throw error;
    }
  }

  public async getFacultyByID(faculty_id: number): Promise<Faculty[]> {
    this.checkConnection();
    try {
      const sql = `SELECT faculty_id FROM faculty WHERE faculty_id = $1`;
      const result = await this.dataSource!.query(sql, [faculty_id]);
      return result;
    } catch (error) {
      this.logDbError("getFacultyByID", error);
      throw error;
    }
  }

  public async getFacultyByName(faculty_name: string): Promise<Faculty[]> {
    this.checkConnection();
    try {
      const name = faculty_name.trim();
      const sql = `SELECT faculty_name FROM faculty WHERE faculty_name = $1`;
      const result = await this.dataSource!.query(sql, [name]);
      return result;
    } catch (error) {
      this.logDbError("getFacultyByName", error);
      throw error;
    }
  }

  public async addFaculty(faculty_name: string): Promise<void> {
    this.checkConnection();
    try {
      const name = faculty_name.trim();
      const sql = `INSERT INTO faculty (faculty_name) VALUES ($1)`;
      await this.dataSource!.query(sql, [name]);
    } catch (error) {
      this.logDbError("addFaculty", error);
      throw error;
    }
  }

  public async updateFacultyByName(
    faculty_id: number,
    faculty_name: string
  ): Promise<void> {
    this.checkConnection();
    try {
      const name = faculty_name.trim();
      const sql = `UPDATE faculty SET faculty_name = $1 WHERE faculty_id = $2`;
      await this.dataSource!.query(sql, [name, faculty_id]);
    } catch (error) {
      this.logDbError("updateFacultyByName", error);
      throw error;
    }
  }

  public async deleteFaculty(faculty_id: number): Promise<void> {
    this.checkConnection();
    try {
      const sql = `DELETE FROM faculty WHERE faculty_id = $1`;
      await this.dataSource!.query(sql, [faculty_id]);
    } catch (error) {
      this.logDbError("deleteFaculty", error);
      throw error;
    }
  }
}
