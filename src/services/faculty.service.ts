// src/services/Teacher/faculty.service.ts

import redis from "../config/redis";
import { FacultyDao } from "../daos/faculty.dao";
import { RoomDao } from "../daos/Teacher/room.dao";
import { FoodDao } from "../daos/Teacher/food.dao";
import { Faculty } from "../entity/faculty.entity";
import { ErrorHandledService } from "./error.handdled.service";

export class FacultyService extends ErrorHandledService {
  constructor(
    private readonly facultyDao = new FacultyDao(),
    private readonly roomDao = new RoomDao(),
    private readonly foodDao = new FoodDao()
  ) {
    super();
  }

  public async countFaculty(): Promise<number> {
    try {
      const count = await this.facultyDao.countFaculty();
      this.logInfo("📊 Faculty count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countFaculty", error);
      throw error;
    }
  }

  public async getFaculty(page: number, limit: number): Promise<Faculty[]> {
    const cacheKey = `faculty:all:${page}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached faculty data");
        return JSON.parse(cached);
      }

      const data = await this.facultyDao.getFaculty(page, limit);
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 Faculty data retrieved and cached", {
        page,
        limit,
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logError("❌ Error in getFaculty", error);
      throw error;
    }
  }

  public async addFaculty(faculty_name: string): Promise<Faculty | null> {
    try {
      const existing = await this.facultyDao.getFacultyByName(faculty_name);
      if (existing.length > 0) {
        this.logInfo("🚫 Duplicate faculty name", { faculty_name });
        return null;
      }

      await this.facultyDao.addFaculty(faculty_name);
      await redis.del("faculty:all");
      this.logInfo("🆕 Faculty created", { faculty_name });

      const inserted = await this.facultyDao.getFacultyByName(faculty_name);
      return inserted[0] || null;
    } catch (error) {
      this.logError("❌ Error in addFaculty", error);
      throw error;
    }
  }

  public async updateFacultyByName(
    faculty_id: number,
    faculty_name: string
  ): Promise<Faculty | null> {
    try {
      const existing = await this.facultyDao.getFacultyByName(faculty_name);
      const isDuplicate = existing.some((f) => f.faculty_id !== faculty_id);

      if (isDuplicate) {
        this.logInfo("🚫 Faculty name already in use", {
          faculty_id,
          faculty_name,
        });
        return null;
      }

      await this.facultyDao.updateFacultyByName(faculty_id, faculty_name);
      await redis.del("faculty:all");
      this.logInfo("✏️ Faculty updated", { faculty_id, faculty_name });

      const updated = await this.facultyDao.getFacultyByID(faculty_id);
      return updated[0] || null;
    } catch (error) {
      this.logError("❌ Error in updateFacultyByName", error);
      throw error;
    }
  }

  public async deleteFaculty(faculty_id: number): Promise<boolean> {
    try {
      const exists = await this.facultyDao.getFacultyByID(faculty_id);
      if (!exists.length) {
        this.logInfo("❌ Faculty not found", { faculty_id });
        return false;
      }

      // cleanup rooms & foods under this faculty
      const rooms = await this.roomDao.getRoomIDByFacultyID(faculty_id);
      if (rooms.length) {
        const foods = await this.foodDao.getFoodIDByFacultyID(faculty_id);
        if (foods.length) {
          await this.foodDao.deletedFoodByFacultyID(faculty_id);
          this.logInfo("🗑️ Foods cleaned up", {
            faculty_id,
            count: foods.length,
          });
        }
        await this.roomDao.deletedRoomByFacultyID(faculty_id);
        this.logInfo("🗑️ Rooms cleaned up", {
          faculty_id,
          count: rooms.length,
        });
      }

      await this.facultyDao.deleteFaculty(faculty_id);
      await redis.del("faculty:all");
      this.logInfo("🗑️ Faculty deleted", { faculty_id });

      return true;
    } catch (error) {
      this.logError("❌ Error in deleteFaculty", error);
      throw error;
    }
  }
}
