import { ActivityDao } from "../../daos/Teacher/activity.dao.newstructure";
import { Activity } from "../../entity/activity.entity";
import redis from "../../config/redis";
import { ErrorHandledService } from "../error.handdled.service";
import { RoomService } from "./room.service";
import { convertDateFieldsToLocal } from "../../utils/convertDateFieldsToLocal";

export class ActivityService extends ErrorHandledService {
  private readonly activityDao = new ActivityDao();
  private readonly roomService = new RoomService();

  public async createActivity(
    input: Activity & { foodIds?: number[]; floor?: string }
  ): Promise<Activity> {
    try {
      const { foodIds, floor, ...activityData } = input;

      const sanitizedData: Partial<Activity> = {
        ...activityData,
        seat: input.seat ?? undefined,
        recieve_hours: input.recieve_hours ?? undefined,
        special_start_register_date:
          input.special_start_register_date ?? undefined,
        start_register_date: input.start_register_date ?? undefined,
        end_register_date: input.end_register_date ?? undefined,
        start_activity_date: input.start_activity_date ?? undefined,
        end_activity_date: input.end_activity_date ?? undefined,
        url: input.url ?? undefined,
        room_id: input.room_id ?? undefined,
        create_activity_date: new Date(),
        last_update_activity_date: new Date(),
      };

      const created = await this.activityDao.createActivityDao(
        sanitizedData,
        foodIds ?? []
      );

      await redis.del("activity:all");

      this.logInfo("🆕 Activity created", {
        activity_name: created.activity_name,
        activity_id: created.activity_id,
      });

      return created;
    } catch (error) {
      this.logError("❌ Error in createActivity", error);
      throw error;
    }
  }

  public async getAllActivities(): Promise<Activity[]> {
    const cacheKey = "activity:all";

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached activity data");
        return JSON.parse(cached);
      }

      const activities = await this.activityDao.getAllActivitiesDao();
      await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);

      this.logInfo("📤 Activity data retrieved and cached", {
        count: activities.length,
      });

      return activities;
    } catch (error) {
      this.logError("❌ Error in getAllActivities", error);
      throw error;
    }
  }

  public async getActivityById(activity_id: number): Promise<Activity | null> {
    try {
      const cacheKey = `activity:${activity_id}`;

      // ✅ ลองดึงจาก cache ก่อน
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached activity by ID", { activity_id });
        return JSON.parse(cached);
      }

      // ✅ ดึงจาก DAO
      const activity = await this.activityDao.findById(activity_id);
      if (!activity) return null;

      // ✅ เก็บลง cache
      await redis.set(cacheKey, JSON.stringify(activity), "EX", 60);
      this.logInfo("📤 Activity by ID retrieved and cached", { activity_id });

      return activity;
    } catch (error) {
      this.logError("❌ Error in getActivityById", error);
      throw error;
    }
  }

  public async updateActivity(
    activity_id: number,
    input: Activity & { foodIds?: number[]; floor?: string }
  ): Promise<Activity | null> {
    const existing = await this.activityDao.findById(activity_id);
    if (!existing) {
      this.logError("⚠️ Activity not found", { activity_id });
      return null;
    }

    if (input.activity_status === "Public") {
      if (
        input.special_start_register_date &&
        input.special_start_register_date >= input.start_activity_date!
      ) {
        throw new Error(
          "special_start_register_date ต้องน้อยกว่า start_activity_date"
        );
      }
      if (
        input.start_register_date &&
        input.start_register_date >= input.start_activity_date!
      ) {
        throw new Error("start_register_date ต้องน้อยกว่า start_activity_date");
      }
      if (
        input.end_register_date &&
        input.start_register_date &&
        input.end_register_date <= input.start_register_date
      ) {
        throw new Error("end_register_date ต้องมากกว่า start_register_date");
      }
      if (
        input.end_activity_date &&
        input.start_activity_date &&
        input.end_activity_date <= input.start_activity_date
      ) {
        throw new Error("end_activity_date ต้องมากกว่า start_activity_date");
      }
    }

    let hrs = input.recieve_hours;
    if (
      input.activity_status === "Public" &&
      input.event_format !== "Course" &&
      input.start_activity_date &&
      input.end_activity_date
    ) {
      const diffMs =
        new Date(input.end_activity_date).getTime() -
        new Date(input.start_activity_date).getTime();
      hrs = Math.floor(diffMs / (1000 * 60 * 60));
    }

    const foods = input.event_format === "Onsite" ? input.foodIds ?? [] : [];

    const localInput = convertDateFieldsToLocal({
      ...input,
      last_update_activity_date: new Date(),
      create_activity_date: input.create_activity_date ?? new Date(),
    });

    const updatedData: Partial<Activity> = {
      ...localInput,
      recieve_hours: hrs ?? undefined,
      seat: input.seat ?? 0,
      assessment_id: input.assessment_id ?? undefined,
      room_id: input.event_format === "Onsite" ? input.room_id : undefined,
      url: input.url ?? undefined,
    };

    this.logInfo("🔧 Prepared updatedData (local time applied)", updatedData);

    const updated = await this.activityDao.updateActivityDao(
      activity_id,
      updatedData,
      foods
    );

    this.logInfo("✅ Activity updated in DB", { activity_id, updated });
    this.logInfo("🍽️ Food assignment", { foods });

    if (input.event_format === "Onsite" && input.room_id && input.floor) {
      await this.roomService.updateRoomFloor(input.room_id, input.floor.trim());
    }

    await redis.del("activity:all");
    this.logInfo("🧹 Redis cache cleared", { key: "activity:all" });

    return updated;
  }

  public async updateActivityByStatus(
    activity_id: number,
    activity_status: string
  ): Promise<boolean> {
    const find_activity = await this.activityDao.getActivityByID(activity_id);
    try {
      if (find_activity.length > 0) {
        const id = find_activity[0].activity_id;
        await this.activityDao.updateActyivityByStatus(id, activity_status);
        await redis.del("activity:all");
        return true;
      } else {
        console.log("ไม่พบ Activity นี้");
        return false;
      }
    } catch (error) {
      this.logError("❌ Error in updateActivityByStatus", error);
      throw error;
    }
  }

  public async softDeleteActivity(
    activity_id: number
  ): Promise<Activity | null> {
    try {
      const activity = await this.activityDao.findById(activity_id);
      if (!activity) return null;

      activity.status = "Inactive";
      const updated = await this.activityDao.save(activity);
      await redis.del("activity:all");

      this.logInfo("🗑️ Activity soft deleted", { activity_id });
      return updated;
    } catch (error) {
      this.logError("❌ Error in softDeleteActivity", error);
      throw error;
    }
  }

  public async hardDeleteActivity(activity_id: number): Promise<boolean> {
    try {
      const activity = await this.activityDao.findById(activity_id);
      if (!activity) return false;

      await this.activityDao.delete(activity_id);
      await redis.del("activity:all");

      this.logInfo("🗑️ Activity hard deleted", { activity_id });
      return true;
    } catch (error) {
      this.logError("❌ Error in hardDeleteActivity", error);
      throw error;
    }
  }
}
