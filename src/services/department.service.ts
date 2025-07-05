// src/services/department.service.ts

import redis from "../config/redis";
import { DepartmentDao } from "../daos/department.dao";
import { Department } from "../entity/department.entity";
import { ErrorHandledService } from "./error.handdled.service";

export class DepartmentService extends ErrorHandledService {
  constructor(private readonly departmentDao = new DepartmentDao()) {
    super();
  }

  public async countDepartment(): Promise<number> {
    try {
      const count = await this.departmentDao.countDepartment();
      this.logInfo("📊 Department count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countDepartment", error);
      throw error;
    }
  }

  public async getDepartment(
    page: number,
    limit: number
  ): Promise<Department[]> {
    const cacheKey = `department:all:${page}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached department data");
        return JSON.parse(cached);
      }

      const data = await this.departmentDao.getDepartment(page, limit);
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 Department data retrieved and cached", {
        page,
        limit,
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logError("❌ Error in getDepartment", error);
      throw error;
    }
  }

  public async addDepartment(
    department_name: string,
    faculty_id: number
  ): Promise<Department | null> {
    try {
      const existing = await this.departmentDao.getDepartmentByName(
        department_name
      );
      if (existing.length > 0) {
        this.logInfo("🚫 Duplicate department name", { department_name });
        return null;
      }

      await this.departmentDao.addDepartment(department_name, faculty_id);
      await redis.del("department:all");

      const created = await this.departmentDao.getDepartmentByName(
        department_name
      );
      const result = created[0] || null;

      this.logInfo("✅ Department created", {
        department_id: result?.department_id,
        department_name,
      });

      return result;
    } catch (error) {
      this.logError("❌ Error in addDepartment", error);
      throw error;
    }
  }

  public async updatedDepartmentByName(
    department_id: number,
    department_name: string,
    faculty_id: number
  ): Promise<Department | null> {
    try {
      const existing = await this.departmentDao.getDepartmentByName(
        department_name
      );
      const isDuplicate = existing.some(
        (d) =>
          d.department_id !== department_id &&
          d.department_name === department_name
      );

      if (isDuplicate) {
        this.logInfo("🚫 Department name already exists on another record", {
          department_name,
          department_id,
        });
        return null;
      }

      await this.departmentDao.updatedDepartmentByName(
        department_id,
        department_name,
        faculty_id
      );

      await redis.del("department:all");

      const updated = await this.departmentDao.getDepartmentByName(
        department_name
      );
      const result =
        updated.find((d) => d.department_id === department_id) || null;

      this.logInfo("✏️ Department updated", { department_id });

      return result;
    } catch (error) {
      this.logError("❌ Error in updatedDepartmentByName", error);
      throw error;
    }
  }

  public async deletedDepartment(department_id: number): Promise<boolean> {
    try {
      const result = await this.departmentDao.deletedDepartment(department_id);
      await redis.del("department:all");

      const deleted = result.length > 0;
      this.logInfo("🗑️ Department deleted", { department_id, deleted });

      return deleted;
    } catch (error) {
      this.logError("❌ Error in deletedDepartment", error);
      throw error;
    }
  }
}
