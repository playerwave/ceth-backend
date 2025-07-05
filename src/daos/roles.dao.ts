import { DataSource } from "typeorm";
import { Roles } from "../entity/roles.entity";
import { connectDatabase } from "../db/database";
import { ErrorHandledDao } from "./error.handled.dao";

export class RolesDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ RolesDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  public async countRoles(): Promise<number> {
    this.checkConnection();
    try {
      const sql = `SELECT COUNT(*) FROM roles`;
      const result = await this.dataSource!.query(sql);
      return result[0].count;
    } catch (error) {
      this.logDbError("countRoles", error);
      throw error;
    }
  }

  public async getRoles(): Promise<Roles[]> {
    this.checkConnection();
    try {
      const sql = `SELECT * FROM roles ORDER BY roles_id DESC`;
      const result = await this.dataSource!.query(sql);
      return result;
    } catch (error) {
      this.logDbError("getRoles", error);
      throw error;
    }
  }

  public async getRolesByName(roles_name: string): Promise<Roles[]> {
    this.checkConnection();
    try {
      const name = roles_name.trim();
      const sql = `SELECT roles_name FROM roles WHERE roles_name = $1`;
      const result = await this.dataSource!.query(sql, [`%${name}%`]);
      return result;
    } catch (error) {
      this.logDbError("getRolesByName", error);
      throw error;
    }
  }

  public async addRoles(roles_name: string): Promise<Roles[]> {
    this.checkConnection();
    try {
      const name = roles_name.trim();
      const sql = `INSERT INTO roles (roles_name) VALUES ($1)`;
      const result = await this.dataSource!.query(sql, [name]);
      return result;
    } catch (error) {
      this.logDbError("addRoles", error);
      throw error;
    }
  }

  public async updatedRolesByName(
    roles_id: number,
    roles_name: string
  ): Promise<Roles[]> {
    this.checkConnection();
    try {
      const name = roles_name.trim();
      const sql = `UPDATE roles SET roles_name = $1 WHERE roles_id = $2`;
      const result = await this.dataSource!.query(sql, [name, roles_id]);
      return result;
    } catch (error) {
      this.logDbError("updatedRolesByName", error);
      throw error;
    }
  }

  public async deletedRoles(roles_id: number): Promise<Roles[]> {
    this.checkConnection();
    try {
      const sql = `DELETE FROM roles WHERE roles_id = $1`;
      const result = await this.dataSource!.query(sql, [roles_id]);
      return result;
    } catch (error) {
      this.logDbError("deletedRoles", error);
      throw error;
    }
  }
}
