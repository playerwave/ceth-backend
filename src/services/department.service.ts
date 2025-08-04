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

  public async createDepartment(
    data: Partial<Department>
  ): Promise<Department | null> {
    try {
      const existing = await this.departmentDao.getDepartmentByName(
        data.department_name!
      );
      if (existing.length > 0) {
        this.logInfo("🚫 Duplicate department name", {
          department_name: data.department_name,
        });
        return null;
      }

      const created = await this.departmentDao.createDepartment(data);
      await redis.del("department:all");

      this.logInfo("✅ Department created", {
        department_id: created?.department_id,
        department_name: data.department_name,
      });

      return created;
    } catch (error) {
      this.logError("❌ Error in createDepartment", error);
      throw error;
    }
  }

  public async updateDepartment(
    department_id: number,
    data: Partial<Department>
  ): Promise<Department | null> {
    try {
      const existing = await this.departmentDao.getDepartmentByName(
        data.department_name!
      );
      const isDuplicate = existing.some(
        (d) =>
          d.department_id !== department_id &&
          d.department_name === data.department_name
      );

      if (isDuplicate) {
        this.logInfo("🚫 Department name already exists on another record", {
          department_name: data.department_name,
          department_id,
        });
        return null;
      }

      const updated = await this.departmentDao.updateDepartment(
        department_id,
        data
      );

      await redis.del("department:all");

      this.logInfo("✏️ Department updated", { department_id });

      return updated;
    } catch (error) {
      this.logError("❌ Error in updateDepartment", error);
      throw error;
    }
  }

  public async getDepartmentById(
    department_id: number
  ): Promise<Department | null> {
    try {
      const result = await this.departmentDao.findById(department_id);
      return result;
    } catch (error) {
      this.logError("❌ Error in getDepartmentById", error);
      throw error;
    }
  }

  public async softDeleteDepartment(
    department_id: number
  ): Promise<Department | null> {
    try {
      // เนื่องจาก Department entity ไม่มี status field
      // ให้ใช้ hard delete แทน หรือไม่ทำ soft delete
      const result = await this.hardDeleteDepartment(department_id);
      return result ? ({ department_id } as Department) : null;
    } catch (error) {
      this.logError("❌ Error in softDeleteDepartment", error);
      throw error;
    }
  }

  public async hardDeleteDepartment(department_id: number): Promise<boolean> {
    try {
      const department = await this.departmentDao.findById(department_id);
      if (!department) return false;

      await this.departmentDao.delete(department_id);
      await redis.del("department:all");

      this.logInfo("🗑️ Department hard deleted", { department_id });
      return true;
    } catch (error) {
      this.logError("❌ Error in hardDeleteDepartment", error);
      throw error;
    }
  }
}
