// src/services/Student/students.service.ts

import redis from "../../config/redis";
import { StudentsDao } from "../../daos/Student/student.dao";
import { UsersDao } from "../../daos/users.dao";
import { Students } from "../../entity/students.entity";
import { ErrorHandledService } from "../error.handdled.service";

export class StudentsService extends ErrorHandledService {
  constructor(
    private readonly studentsDao = new StudentsDao(),
    private readonly usersDao = new UsersDao()
  ) {
    super();
  }

  public async countStudents(): Promise<number> {
    try {
      const count = await this.studentsDao.countStudents();
      this.logInfo("📊 Students count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countStudents", error);
      throw error;
    }
  }

  public async getStudentsSuccess(
    page: number,
    limit: number
  ): Promise<Students[]> {
    const cacheKey = `students:all:${page}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached students data");
        return JSON.parse(cached);
      }

      const data = await this.studentsDao.getStudentsSuccess(page, limit);
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 Paginated students data retrieved and cached", {
        page,
        limit,
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logError("❌ Error in getStudentsSuccess", error);
      throw error;
    }
  }

  public async getStudents(): Promise<Students[]> {
    const cacheKey = "students:all";

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached students data");
        return JSON.parse(cached);
      }

      const data = await this.studentsDao.getStudents();
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 Students data retrieved and cached", {
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logError("❌ Error in getStudents", error);
      throw error;
    }
  }

  public async addStudents(data: {
    users_id: number;
    first_name: string;
    last_name: string;
    email: string;
    education_status: string;
    faculty_id: number;
    department_id: number;
    grade_id: number;
    eventcoop_id: number;
  }): Promise<Students | null> {
    try {
      const existing = await this.studentsDao.getStudentsByEmail(data.email);
      if (existing.length > 0) {
        this.logInfo("🚫 Duplicate email", { email: data.email });
        return null;
      }

      await this.studentsDao.addStudents(
        data.users_id,
        data.first_name,
        data.last_name,
        data.email,
        data.education_status,
        data.faculty_id,
        data.department_id,
        data.grade_id,
        data.eventcoop_id
      );

      await redis.del("students:all");
      this.logInfo("🆕 Student created", { email: data.email });

      const inserted = await this.studentsDao.getStudentsByEmail(data.email);
      return inserted[0] || null;
    } catch (error) {
      this.logError("❌ Error in addStudents", error);
      throw error;
    }
  }

  public async updatedStudents(
    students_id: number,
    data: {
      first_name: string;
      last_name: string;
      email: string;
      education_status: string;
      faculty_id: number;
      department_id: number;
      grade_id: number;
      eventcoop_id: number;
    }
  ): Promise<Students | null> {
    try {
      const found = await this.studentsDao.getStudentsByID(students_id);
      if (!found.length) {
        this.logInfo("❌ Student not found", { students_id });
        return null;
      }

      const currentEmail = found[0].email;
      if (data.email === currentEmail) {
        await this.studentsDao.updatedStudentNotEmail(
          data.first_name,
          data.last_name,
          data.education_status,
          data.faculty_id,
          data.department_id,
          data.grade_id,
          data.eventcoop_id,
          students_id
        );
      } else {
        const emailExists = await this.studentsDao.getStudentsByEmail(
          data.email
        );
        if (emailExists.length > 0) {
          this.logInfo("🚫 Duplicate new email", { email: data.email });
          return null;
        }

        await this.studentsDao.updatedStudents(
          data.first_name,
          data.last_name,
          data.email,
          data.education_status,
          data.faculty_id,
          data.department_id,
          data.grade_id,
          data.eventcoop_id,
          students_id
        );
      }

      await redis.del("students:all");
      this.logInfo("✏️ Student updated", { students_id });

      const updated = await this.studentsDao.getStudentsByID(students_id);
      return updated[0] || null;
    } catch (error) {
      this.logError("❌ Error in updatedStudents", error);
      throw error;
    }
  }

  // public async deletedStudents(students_id: number): Promise<boolean> {
  //   try {
  //     const userIdResult = await this.studentsDao.getUsersIDByStudents(
  //       students_id
  //     );
  //     if (!userIdResult.length) {
  //       this.logInfo("❌ No linked user found", { students_id });
  //       return false;
  //     }

  //     const userId = userIdResult[0].users_id;
  //     const deleted = await this.studentsDao.deletedStudents(students_id);
  //     if (!deleted.length) {
  //       this.logInfo("❌ Student deletion failed", { students_id });
  //       return false;
  //     }

  //     await this.usersDao.deleteUsers(userId);
  //     await redis.del("students:all");
  //     this.logInfo("🗑️ Student and linked user deleted", {
  //       students_id,
  //       users_id: userId,
  //     });

  //     return true;
  //   } catch (error) {
  //     this.logError("❌ Error in deletedStudents", error);
  //     throw error;
  //   }
  // }

  public async deletedStudents(
    students_id: number
  ): Promise<"soft" | "hard" | null> {
    try {
      const userIdResult = await this.studentsDao.getUsersIDByStudents(
        students_id
      );
      if (!userIdResult.length) return null;

      const userId = userIdResult[0].users_id;
      const hasRelation = await this.studentsDao.hasRelations(students_id);

      let deleted = false;
      if (hasRelation) {
        deleted = await this.studentsDao.softDeleteStudents(students_id);
        this.logInfo("🟡 Soft deleted student", { students_id });
      } else {
        deleted = await this.studentsDao.hardDeleteStudents(students_id);
        if (deleted) {
          await this.usersDao.deleteUsers(userId);
          this.logInfo("🗑️ Hard deleted student and user", {
            students_id,
            users_id: userId,
          });
        }
      }

      if (deleted) await redis.del("students:all");
      return deleted ? (hasRelation ? "soft" : "hard") : null;
    } catch (error) {
      this.logError("❌ Error in deletedStudents", error);
      throw error;
    }
  }
}
