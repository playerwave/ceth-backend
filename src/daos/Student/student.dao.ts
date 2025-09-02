import { DataSource } from "typeorm";
import { Students } from "../../entity/students.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class StudentsDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ StudentsDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  public async countStudents(): Promise<number> {
    this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        "SELECT COUNT(*) FROM users JOIN roles ON users.roles_id = roles.roles_id JOIN students ON users.users_id = students.users_id WHERE users.roles_id = 3"
      );
      return result[0].count;
    } catch (error) {
      this.logDbError("countStudents", error);
      throw error;
    }
  }

  public async getStudentsSuccess(
    page: number,
    limit: number
  ): Promise<Students[]> {
    this.checkConnection();
    try {
      const offset = (page - 1) * limit;
      const sql = `SELECT students.students_id, users.username, roles.roles_name, students.first_name_tha, students.first_name_eng, students.last_name_tha, students.last_name_eng, students.email, students.soft_hours, students.hard_hours, students.risk_status, students.education_status, faculty.faculty_name, department.department_name, grade.level, event_coop.date FROM users JOIN roles ON users.roles_id = roles.roles_id JOIN students ON users.users_id = students.users_id JOIN faculty ON students.faculty_id = faculty.faculty_id JOIN department ON students.department_id = department.department_id JOIN grade ON students.grade_id = grade.grade_id JOIN event_coop ON students.eventcoop_id = event_coop.eventcoop_id WHERE users.roles_id = 3 ORDER BY users.users_id ASC LIMIT $1 OFFSET $2`;
      return await this.dataSource!.query(sql, [limit, offset]);
    } catch (error) {
      this.logDbError("getStudentsSuccess", error);
      throw error;
    }
  }

  public async getStudents(): Promise<Students[]> {
    this.checkConnection();
    try {
      const sql = `SELECT students.students_id, users.username, roles.roles_name, students.first_name_tha, students.first_name_eng, students.last_name_tha, students.last_name_eng, students.email, students.soft_hours, students.hard_hours, students.risk_status, students.education_status, students.faculty_id, students.department_id, students.grade_id, students.eventcoop_id FROM users JOIN roles ON users.roles_id = roles.roles_id JOIN students ON users.users_id = students.users_id WHERE users.roles_id = 3 ORDER BY students.students_id ASC`;
      return await this.dataSource!.query(sql);
    } catch (error) {
      this.logDbError("getStudents", error);
      throw error;
    }
  }

  public async getStudentsByEmail(email: string): Promise<Students[]> {
    this.checkConnection();
    try {
      const sql = `SELECT email FROM students WHERE email LIKE $1`;
      return await this.dataSource!.query(sql, [`%${email.trim()}%`]);
    } catch (error) {
      this.logDbError("getStudentsByEmail", error);
      throw error;
    }
  }

  public async getStudentsByID(student_id: number): Promise<Students[]> {
    this.checkConnection();
    try {
      const sql = `SELECT * FROM students WHERE students_id = $1`;
      return await this.dataSource!.query(sql, [student_id]);
    } catch (error) {
      this.logDbError("getStudentsByID", error);
      throw error;
    }
  }

  public async getUsersIDByStudents(students_id: number): Promise<Students[]> {
    this.checkConnection();
    try {
      const sql = `SELECT users_id FROM students WHERE students_id = $1`;
      return await this.dataSource!.query(sql, [students_id]);
    } catch (error) {
      this.logDbError("getUsersIDByStudents", error);
      throw error;
    }
  }

  public async getStudentByUserId(users_id: number): Promise<Students | null> {
    this.checkConnection();
    try {
      const sql = `
        SELECT 
          s.students_id,
          s.users_id,
          s.first_name_tha,
          s.first_name_eng,
          s.last_name_tha,
          s.last_name_eng,
          s.email,
          s.soft_hours,
          s.hard_hours,
          s.risk_status,
          s.education_status,
          s.faculty_id,
          s.department_id,
          s.grade_id,
          s.eventcoop_id,
          f.faculty_name,
          d.department_name,
          g.level as grade_level,
          ec.date as event_coop_date
        FROM students s
        LEFT JOIN faculty f ON s.faculty_id = f.faculty_id
        LEFT JOIN department d ON s.department_id = d.department_id
        LEFT JOIN grade g ON s.grade_id = g.grade_id
        LEFT JOIN event_coop ec ON s.eventcoop_id = ec.eventcoop_id
        WHERE s.users_id = $1
      `;
      const result = await this.dataSource!.query(sql, [users_id]);
      return result[0] || null;
    } catch (error) {
      this.logDbError("getStudentByUserId", error);
      throw error;
    }
  }

  public async getStudentsByRiskStatus(risk_status: string): Promise<Students[]> {
    this.checkConnection();
    try {
      const sql = `
        SELECT 
          s.students_id,
          s.users_id,
          s.first_name_tha,
          s.first_name_eng,
          s.last_name_tha,
          s.last_name_eng,
          s.email,
          s.soft_hours,
          s.hard_hours,
          s.risk_status,
          s.education_status,
          s.faculty_id,
          s.department_id,
          s.grade_id,
          s.eventcoop_id,
          f.faculty_name,
          d.department_name,
          g.level as grade_level,
          ec.date as event_coop_date
        FROM students s
        LEFT JOIN faculty f ON s.faculty_id = f.faculty_id
        LEFT JOIN department d ON s.department_id = d.department_id
        LEFT JOIN grade g ON s.grade_id = g.grade_id
        LEFT JOIN event_coop ec ON s.eventcoop_id = ec.eventcoop_id
        WHERE s.risk_status = $1
        ORDER BY s.students_id ASC
      `;
      return await this.dataSource!.query(sql, [risk_status]);
    } catch (error) {
      this.logDbError("getStudentsByRiskStatus", error);
      throw error;
    }
  }

  public async addStudents(
    users_id: number,
    first_name: string,
    last_name: string,
    email: string,
    education_status: string,
    faculty_id: number | null,
    department_id: number | null,
    grade_id: number | null,
    eventcoop_id: number | null
  ): Promise<Students[]> {
    this.checkConnection();
    try {
      const sql = `INSERT INTO students (users_id, first_name, last_name, email, education_status, faculty_id, department_id, grade_id, eventcoop_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
      return await this.dataSource!.query(sql, [
        users_id,
        first_name.trim(),
        last_name.trim(),
        email.trim(),
        education_status.trim(),
        faculty_id,
        department_id,
        grade_id,
        eventcoop_id,
      ]);
    } catch (error) {
      this.logDbError("addStudents", error);
      throw error;
    }
  }

  public async add(users_id: number): Promise<void> {
    this.checkConnection();
    await this.dataSource!.query(
      `INSERT INTO students (users_id, soft_hours, hard_hours, risk_status, education_status, faculty_id, department_id, grade_id, eventcoop_id)
     VALUES ($1, 0, 0, 'Normal', 'Studying', NULL, NULL, NULL, NULL)`,
      [users_id]
    );
  }

  public async updatedStudents(
    first_name: string,
    last_name: string,
    email: string,
    education_status: string,
    faculty_id: number | null,
    department_id: number | null,
    grade_id: number | null,
    eventcoop_id: number | null,
    students_id: number,
    soft_hours?: number | null,
    hard_hours?: number | null,
    risk_status?: string | null
  ): Promise<Students[]> {
    this.checkConnection();
    try {
      const sql = `UPDATE students SET first_name = $1, last_name = $2, email = $3, education_status = $4, faculty_id = $5, department_id = $6, grade_id = $7, eventcoop_id = $8, soft_hours = $9, hard_hours = $10, risk_status = $11 WHERE students_id = $12`;
      return await this.dataSource!.query(sql, [
        first_name,
        last_name,
        email,
        education_status,
        faculty_id,
        department_id,
        grade_id,
        eventcoop_id,
        soft_hours,
        hard_hours,
        risk_status,
        students_id,
      ]);
    } catch (error) {
      this.logDbError("updatedStudents", error);
      throw error;
    }
  }

  public async updatedStudentNotEmail(
    first_name: string,
    last_name: string,
    education_status: string,
    faculty_id: number | null,
    department_id: number | null,
    grade_id: number | null,
    eventcoop_id: number | null,
    students_id: number,
    soft_hours?: number | null,
    hard_hours?: number | null,
    risk_status?: string | null
  ): Promise<Students[]> {
    this.checkConnection();
    try {
      const sql = `UPDATE students SET first_name = $1, last_name = $2, education_status = $3, faculty_id = $4, department_id = $5, grade_id = $6, eventcoop_id = $7, soft_hours = $8, hard_hours = $9, risk_status = $10 WHERE students_id = $11`;
      return await this.dataSource!.query(sql, [
        first_name,
        last_name,
        education_status,
        faculty_id,
        department_id,
        grade_id,
        eventcoop_id,
        soft_hours,
        hard_hours,
        risk_status,
        students_id,
      ]);
    } catch (error) {
      this.logDbError("updatedStudentNotEmail", error);
      throw error;
    }
  }

  // public async deletedStudents(students_id: number): Promise<Students[]> {
  //   this.checkConnection();
  //   try {
  //     const sql = `DELETE FROM students WHERE students_id = $1`;
  //     return await this.dataSource!.query(sql, [students_id]);
  //   } catch (error) {
  //     this.logDbError("deletedStudents", error);
  //     throw error;
  //   }
  // }

  // students.dao.ts
  public async softDeleteStudents(students_id: number): Promise<boolean> {
    this.checkConnection();
    const result = await this.dataSource!.query(
      `UPDATE students SET status = 'InActive' WHERE students_id = $1 RETURNING *`,
      [students_id]
    );
    return result.length > 0;
  }

  public async hardDeleteStudents(students_id: number): Promise<boolean> {
    this.checkConnection();
    const result = await this.dataSource!.query(
      `DELETE FROM students WHERE students_id = $1 RETURNING *`,
      [students_id]
    );
    return result.length > 0;
  }

  public async hasRelations(students_id: number): Promise<boolean> {
    this.checkConnection();

    const relatedTables = [
      { table: '"join"', column: "students_id" },
      { table: "certificate", column: "students_id" },
    ];

    for (const { table, column } of relatedTables) {
      const result = await this.dataSource!.query(
        `SELECT 1 FROM ${table} WHERE ${column} = $1 LIMIT 1`,
        [students_id]
      );
      if (result.length > 0) return true;
    }

    return false;
  }

  public async deletedStudentsByUsersID(users_id: number): Promise<void> {
    console.log("user id in dao:", users_id);

    this.checkConnection();
    const sql = `DELETE FROM students WHERE users_id = $1`;
    await this.dataSource!.query(sql, [users_id]);
  }
}
