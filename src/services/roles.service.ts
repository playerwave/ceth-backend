// src/services/roles.service.ts

import redis from "../config/redis";
import { RolesDao } from "../daos/roles.dao";
import { Roles } from "../entity/roles.entity";
import { ErrorHandledService } from "./error.handdled.service";

export class RolesService extends ErrorHandledService {
  private readonly cacheKey = "roles:all";

  constructor(private readonly rolesDao = new RolesDao()) {
    super();
  }

  public async countRoles(): Promise<number> {
    try {
      const count = await this.rolesDao.countRoles();
      this.logInfo("📊 Roles count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countRoles", error);
      throw error;
    }
  }

  public async getRoles(): Promise<Roles[]> {
    try {
      const cached = await redis.get(this.cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached roles data");
        return JSON.parse(cached);
      }

      const data = await this.rolesDao.getRoles();
      await redis.set(this.cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 Roles data retrieved and cached", {
        count: data.length,
      });
      return data;
    } catch (error) {
      this.logError("❌ Error in getRoles", error);
      throw error;
    }
  }

  public async addRoles(roles_name: string): Promise<boolean> {
    try {
      const existing = await this.rolesDao.getRolesByName(roles_name);
      if (existing.length > 0) {
        this.logInfo("🚫 Duplicate role name", { roles_name });
        return false;
      }

      await this.rolesDao.addRoles(roles_name.trim());
      await redis.del(this.cacheKey);
      this.logInfo("🆕 Role created", { roles_name });
      return true;
    } catch (error) {
      this.logError("❌ Error in addRoles", error);
      throw error;
    }
  }

  public async updatedRolesByName(
    roles_id: number,
    roles_name: string
  ): Promise<boolean> {
    try {
      const existing = await this.rolesDao.getRolesByName(roles_name);
      if (existing.length > 0) {
        this.logInfo("🚫 Duplicate role name", { roles_name });
        return false;
      }

      await this.rolesDao.updatedRolesByName(roles_id, roles_name.trim());
      await redis.del(this.cacheKey);
      this.logInfo("✏️ Role updated", { roles_id, roles_name });
      return true;
    } catch (error) {
      this.logError("❌ Error in updatedRolesByName", error);
      throw error;
    }
  }

  public async deletedRoles(roles_id: number): Promise<boolean> {
    try {
      const result = await this.rolesDao.deletedRoles(roles_id);
      await redis.del(this.cacheKey);

      const deleted = Array.isArray(result) && result.length > 0;
      this.logInfo("🗑️ Role deleted", { roles_id, deleted });
      return deleted;
    } catch (error) {
      this.logError("❌ Error in deletedRoles", error);
      throw error;
    }
  }
}
