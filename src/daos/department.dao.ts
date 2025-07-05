import { DataSource } from "typeorm";
import { Department } from "../entity/department.entity";
import { connectDatabase } from "../db/database";
import { ErrorHandledDao } from "./error.handled.dao";

export class DepartmentDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ DepartmentDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  public async countDepartment(): Promise<number> {
    this.checkConnection();
    try {
      const sql = `SELECT COUNT(*) FROM department`;
      const result = await this.dataSource!.query(sql);
      return result[0].count;
    } catch (error) {
      this.logDbError("countDepartment", error);
      throw error;
    }
  }

  public async getDepartment(
    page: number,
    limit: number
  ): Promise<Department[]> {
    this.checkConnection();
    try {
      const offset = (page - 1) * limit;
      const sql = `SELECT * FROM department ORDER BY department_id ASC LIMIT $1 OFFSET $2`;
      const result = await this.dataSource!.query(sql, [limit, offset]);
      return result;
    } catch (error) {
      this.logDbError("getDepartment", error);
      throw error;
    }
  }

  public async getDepartmentByName(
    department_name: string
  ): Promise<Department[]> {
    this.checkConnection();
    try {
      const name = department_name.trim();
      const sql = `SELECT department_name FROM department WHERE department_name = $1`;
      const result = await this.dataSource!.query(sql, [`%${name}%`]);
      return result;
    } catch (error) {
      this.logDbError("getDepartmentByName", error);
      throw error;
    }
  }

  public async addDepartment(
    department_name: string,
    faculty_id: number
  ): Promise<Department[]> {
    this.checkConnection();
    try {
      const name = department_name.trim();
      const sql = `INSERT INTO department (department_name, faculty_id) VALUES ($1, $2)`;
      const result = await this.dataSource!.query(sql, [name, faculty_id]);
      return result;
    } catch (error) {
      this.logDbError("addDepartment", error);
      throw error;
    }
  }

  public async updatedDepartmentByName(
    department_id: number,
    department_name: string,
    faculty_id: number
  ): Promise<Department[]> {
    this.checkConnection();
    try {
      const name = department_name.trim();
      const sql = `UPDATE department SET department_name = $1, faculty_id = $2 WHERE department_id = $3`;
      const result = await this.dataSource!.query(sql, [
        name,
        faculty_id,
        department_id,
      ]);
      return result;
    } catch (error) {
      this.logDbError("updatedDepartmentByName", error);
      throw error;
    }
  }

  public async deletedDepartment(department_id: number): Promise<Department[]> {
    this.checkConnection();
    try {
      const sql = `DELETE FROM department WHERE department_id = $1`;
      const result = await this.dataSource!.query(sql, [department_id]);
      return result;
    } catch (error) {
      this.logDbError("deletedDepartment", error);
      throw error;
    }
  }
}
