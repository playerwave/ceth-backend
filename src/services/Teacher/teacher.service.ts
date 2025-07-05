// src/services/Teacher/teacher.service.ts

import redis from "../../config/redis";
import { TeacherDao } from "../../daos/Teacher/teacher.dao";
import { UsersDao } from "../../daos/users.dao";
import { Teacher } from "../../entity/teacher.entity";
import { ErrorHandledService } from "../error.handdled.service";

interface UpdateTeacherPayload {
  first_name: string | null;
  last_name: string | null;
  faculty_id: number | null;
}

export class TeacherService extends ErrorHandledService {
  constructor(
    private readonly teacherDao = new TeacherDao(),
    private readonly usersDao = new UsersDao()
  ) {
    super();
  }

  public async countTeacher(): Promise<number> {
    try {
      const count = await this.teacherDao.countTeacher();
      this.logInfo("📊 Teacher count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countTeacher", error);
      throw error;
    }
  }

  public async getTeacher(): Promise<Teacher[]> {
    const cacheKey = `teacher:all`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached teacher data");
        return JSON.parse(cached);
      }

      const data = await this.teacherDao.getTeacher();
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 Teacher data retrieved and cached", {
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logError("❌ Error in getTeacher", error);
      throw error;
    }
  }

  public async getTeacherSuccess(
    page: number,
    limit: number
  ): Promise<Teacher[]> {
    const cacheKey = `teacher:success:${page}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached paginated teacher data");
        return JSON.parse(cached);
      }

      const data = await this.teacherDao.getTeacherSuccess(page, limit);
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 Paginated teacher data retrieved and cached", {
        page,
        limit,
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logError("❌ Error in getTeacherSuccess", error);
      throw error;
    }
  }

  public async updatedTeacher(
    teacher_id: number,
    first_name: string | null,
    last_name: string | null,
    faculty_id: number | null
  ): Promise<boolean> {
    try {
      const found = await this.teacherDao.getTeacherByID(teacher_id);
      if (!found.length) return false;

      await this.teacherDao.updatedTeacher(
        teacher_id,
        first_name,
        last_name,
        faculty_id
      );

      await redis.del("teacher:all");
      this.logInfo("✏️ Teacher updated", { teacher_id });
      return true;
    } catch (error) {
      this.logError("❌ Error in updatedTeacher", error);
      throw error;
    }
  }

  public async deletedTeacher(teacher_id: number): Promise<boolean> {
    try {
      const user = await this.teacherDao.getUsersIDByTeacher(teacher_id);
      const result = await this.teacherDao.deletedTeacher(teacher_id);

      if (result.length > 0) {
        const usersID = user[0]?.users_id;
        if (usersID) {
          await this.usersDao.deleteUsers(usersID);
        }

        await redis.del("teacher:all");
        this.logInfo("🗑️ Teacher and linked user deleted", {
          teacher_id,
          users_id: user[0]?.users_id,
        });

        return true;
      }

      return false;
    } catch (error) {
      this.logError("❌ Error in deletedTeacher", error);
      throw error;
    }
  }
}
