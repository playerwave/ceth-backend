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
    department_name_tha: string
  ): Promise<Department[]> {
    this.checkConnection();
    try {
      const name = department_name_tha.trim();
      const sql = `SELECT department_name_tha, department_name_eng FROM department WHERE department_name_tha = $1`;
      const result = await this.dataSource!.query(sql, [`%${name}%`]);
      return result;
    } catch (error) {
      this.logDbError("getDepartmentByName", error);
      throw error;
    }
  }

  public async createDepartment(
    data: Partial<Department>
  ): Promise<Department> {
    this.checkConnection();
    try {
      const sql = `INSERT INTO department (department_name_tha, department_name_eng, department_short_name, faculty_id) VALUES ($1, $2, $3, $4) RETURNING *`;
      const result = await this.dataSource!.query(sql, [
        data.department_name_tha?.trim(),
        data.department_name_eng?.trim(),
        data.department_short_name?.trim(),
        data.faculty_id,
      ]);
      return result[0];
    } catch (error) {
      this.logDbError("createDepartment", error);
      throw error;
    }
  }

  public async updateDepartment(
    department_id: number,
    data: Partial<Department>
  ): Promise<Department> {
    this.checkConnection();
    try {
      const sql = `UPDATE department SET department_name_tha = $1, department_name_eng = $2, department_short_name = $3, faculty_id = $4 WHERE department_id = $5 RETURNING *`;
      const result = await this.dataSource!.query(sql, [
        data.department_name_tha?.trim(),
        data.department_name_eng?.trim(),
        data.department_short_name?.trim(),
        data.faculty_id,
        department_id,
      ]);
      return result[0];
    } catch (error) {
      this.logDbError("updateDepartment", error);
      throw error;
    }
  }

  public async findById(id: number): Promise<Department | null> {
    this.checkConnection();
    try {
      const sql = `SELECT * FROM department WHERE department_id = $1`;
      const result = await this.dataSource!.query(sql, [id]);
      return result[0] || null;
    } catch (error) {
      this.logDbError("findById", error);
      throw error;
    }
  }

  public async delete(id: number): Promise<void> {
    this.checkConnection();
    try {
      const sql = `DELETE FROM department WHERE department_id = $1`;
      await this.dataSource!.query(sql, [id]);
    } catch (error) {
      this.logDbError("delete", error);
      throw error;
    }
  }
}
