import { DataSource } from "typeorm";
import { Teacher } from "../../entity/teacher.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class TeacherDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ TeacherDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  public async countTeacher(): Promise<number> {
    this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `SELECT COUNT(*) FROM teacher`
      );
      return parseInt(result[0].count, 10);
    } catch (error) {
      this.logDbError("countTeacher", error);
      throw error;
    }
  }

  public async getTeacher(): Promise<Teacher[]> {
    this.checkConnection();
    try {
      const sql = `
        SELECT teacher.teacher_id, users.username, roles.roles_name,
               teacher.first_name, teacher.last_name, teacher.faculty_id
        FROM users
        JOIN roles ON users.roles_id = roles.roles_id
        JOIN teacher ON users.users_id = teacher.users_id
        WHERE users.roles_id = 2
        ORDER BY teacher.teacher_id ASC`;
      return await this.dataSource!.query(sql);
    } catch (error) {
      this.logDbError("getTeacher", error);
      throw error;
    }
  }

  public async getTeacherSuccess(
    page: number,
    limit: number
  ): Promise<Teacher[]> {
    this.checkConnection();
    try {
      const offset = (page - 1) * limit;
      const sql = `
        SELECT teacher.teacher_id, users.username, roles.roles_name,
               teacher.first_name, teacher.last_name, faculty.faculty_name
        FROM users
        JOIN roles ON users.roles_id = roles.roles_id
        JOIN teacher ON users.users_id = teacher.users_id
        JOIN faculty ON teacher.faculty_id = faculty.faculty_id
        WHERE users.roles_id = 2
        ORDER BY teacher.teacher_id ASC
        LIMIT $1 OFFSET $2`;
      return await this.dataSource!.query(sql, [limit, offset]);
    } catch (error) {
      this.logDbError("getTeacherSuccess", error);
      throw error;
    }
  }

  // public async addUserIDTeacher(users_id: number): Promise<void> {
  //   this.checkConnection();
  //   try {
  //     const sql = `INSERT INTO teacher (users_id) VALUES ($1)`;
  //     await this.dataSource!.query(sql, [users_id]);
  //   } catch (error) {
  //     this.logDbError("addUserIDTeacher", error);
  //     throw error;
  //   }
  // }

  public async addUserIDTeacher(users_id: number): Promise<void> {
    this.checkConnection();
    try {
      // 🛡 ตรวจสอบว่า user นี้เป็น role ครูจริง (roles_id = 2)
      const checkRoleSql = `SELECT roles_id FROM users WHERE users_id = $1`;
      const result = await this.dataSource!.query(checkRoleSql, [users_id]);

      if (!result.length || result[0].roles_id !== 2) {
        throw new Error(
          `❌ Cannot insert into teacher: users_id ${users_id} does not have role 'Teacher' (roles_id !== 2)`
        );
      }

      // ✅ insert เมื่อผ่านการตรวจสอบ
      const sql = `INSERT INTO teacher (users_id) VALUES ($1)`;
      await this.dataSource!.query(sql, [users_id]);
    } catch (error) {
      this.logDbError("addUserIDTeacher", error);
      throw error;
    }
  }

  public async getTeacherByID(teacher_id: number): Promise<Teacher[]> {
    this.checkConnection();
    try {
      const sql = `SELECT * FROM teacher WHERE teacher_id = $1`;
      return await this.dataSource!.query(sql, [teacher_id]);
    } catch (error) {
      this.logDbError("getTeacherByID", error);
      throw error;
    }
  }

  public async getUsersIDByTeacher(teacher_id: number): Promise<Teacher[]> {
    this.checkConnection();
    try {
      const sql = `SELECT users_id FROM teacher WHERE teacher_id = $1`;
      return await this.dataSource!.query(sql, [teacher_id]);
    } catch (error) {
      this.logDbError("getUsersIDByTeacher", error);
      throw error;
    }
  }

  public async updatedTeacher(
    teacher_id: number,
    first_name: string | null,
    last_name: string | null,
    faculty_id: number | null
  ): Promise<Teacher[]> {
    this.checkConnection();
    try {
      const sql = `UPDATE teacher SET first_name = $1, last_name = $2, faculty_id = $3 WHERE teacher_id = $4`;
      return await this.dataSource!.query(sql, [
        first_name?.trim(),
        last_name?.trim(),
        faculty_id,
        teacher_id,
      ]);
    } catch (error) {
      this.logDbError("updatedTeacher", error);
      throw error;
    }
  }

  public async deletedTeacher(teacher_id: number): Promise<Teacher[]> {
    this.checkConnection();
    try {
      const sql = `DELETE FROM teacher WHERE teacher_id = $1`;
      return await this.dataSource!.query(sql, [teacher_id]);
    } catch (error) {
      this.logDbError("deletedTeacher", error);
      throw error;
    }
  }

  public async deletedTeacherByUsersID(users_id: number): Promise<Teacher[]> {
    this.checkConnection();
    try {
      const sql = `DELETE FROM teacher WHERE users_id = $1`;
      return await this.dataSource!.query(sql, [users_id]);
    } catch (error) {
      this.logDbError("deletedTeacherByUsersID", error);
      throw error;
    }
  }
}
