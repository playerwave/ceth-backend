// import { ActivityDao } from "../../daos/Teacher/activity.dao.newstructure";
// import { Activity } from "../../entity/activity.entity";
// import redis from "../../config/redis";
// import { ErrorHandledService } from "../error.handdled.service";
// import { RoomService } from "./room.service";

// // ✅ Inline type definition
// type ActivityInput = {
//   activity_name: string;
//   presenter_company_name: string;
//   type: "Soft" | "Hard";
//   description: string;
//   seat: number | null;
//   recieve_hours: number | null;
//   event_format: "Online" | "Onsite" | "Course";
//   create_activity_date: Date;
//   special_start_register_date: Date | null;
//   start_register_date: Date | null;
//   end_register_date: Date | null;
//   start_activity_date: Date | null;
//   end_activity_date: Date | null;
//   image_url: string;
//   activity_status: "Private" | "Public";
//   activity_state:
//     | "Not Start"
//     | "Special Open Register"
//     | "Open Register"
//     | "Close Register"
//     | "Start Activity"
//     | "End Activity"
//     | "Start Assessment"
//     | "End Assessment";
//   status: "Active" | "Inactive";
//   url: string | null;
//   assessment_id: number;
//   room_id: number | null;
//   foodIds: number[];
//   floor?: string;
// };

// export class ActivityService extends ErrorHandledService {
//   private readonly activityDao = new ActivityDao();
//   private readonly roomService = new RoomService();

//   public async createActivity(input: Activity): Promise<Activity> {
//     try {
//       const { foodIds, ...activityData } = input;

//       // 🔄 แปลง null เป็น undefined เพื่อให้ตรงกับ Partial<Activity>
//       const sanitizedData: Partial<Activity> = {
//         ...activityData,
//         seat: input.seat ?? undefined,
//         recieve_hours: input.recieve_hours ?? undefined,
//         special_start_register_date:
//           input.special_start_register_date ?? undefined,
//         start_register_date: input.start_register_date ?? undefined,
//         end_register_date: input.end_register_date ?? undefined,
//         start_activity_date: input.start_activity_date ?? undefined,
//         end_activity_date: input.end_activity_date ?? undefined,
//         url: input.url ?? undefined,
//         room_id: input.room_id ?? undefined,
//       };

//       const created = await this.activityDao.createActivityDao(
//         sanitizedData,
//         foodIds
//       );
//       await redis.del("activity:all");

//       this.logInfo("🆕 Activity created", {
//         activity_name: created.activity_name,
//         activity_id: created.activity_id,
//       });

//       return created;
//     } catch (error) {
//       this.logError("❌ Error in createActivity", error);
//       throw error;
//     }
//   }

//   public async getAllActivities(): Promise<Activity[]> {
//     const cacheKey = "activity:all";

//     try {
//       const cached = await redis.get(cacheKey);
//       if (cached) {
//         this.logInfo("📦 Returning cached activity data");
//         return JSON.parse(cached);
//       }

//       const activities = await this.activityDao.getAllActivitiesDao();
//       await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);

//       this.logInfo("📤 Activity data retrieved and cached", {
//         count: activities.length,
//       });

//       return activities;
//     } catch (error) {
//       this.logError("❌ Error in getAllActivities", error);
//       throw error;
//     }
//   }

//   public async updateActivity(
//     activity_id: number,
//     input: ActivityInput
//   ): Promise<Activity | null> {
//     // 1) หา activity เดิม
//     const existing = await this.activityDao.findById(activity_id);
//     if (!existing) return null;

//     // 2) Validate ลำดับวันเมื่อเป็น Public
//     if (input.activity_status === "Public") {
//       if (
//         input.special_start_register_date &&
//         input.special_start_register_date >= input.start_activity_date!
//       ) {
//         throw new Error(
//           "special_start_register_date ต้องน้อยกว่า start_activity_date"
//         );
//       }
//       if (
//         input.start_register_date &&
//         input.start_register_date >= input.start_activity_date!
//       ) {
//         throw new Error("start_register_date ต้องน้อยกว่า start_activity_date");
//       }
//       if (
//         input.end_register_date &&
//         input.start_register_date &&
//         input.end_register_date <= input.start_register_date
//       ) {
//         throw new Error("end_register_date ต้องมากกว่า start_register_date");
//       }
//       if (
//         input.end_activity_date &&
//         input.start_activity_date &&
//         input.end_activity_date <= input.start_activity_date
//       ) {
//         throw new Error("end_activity_date ต้องมากกว่า start_activity_date");
//       }
//     }

//     // 3) คำนวณ recieve_hours อัตโนมัติเมื่อไม่ใช่ Course
//     let hrs = input.recieve_hours;
//     if (
//       input.activity_status === "Public" &&
//       input.event_format !== "Course" &&
//       input.start_activity_date &&
//       input.end_activity_date
//     ) {
//       const diffMs =
//         new Date(input.end_activity_date).getTime() -
//         new Date(input.start_activity_date).getTime();
//       hrs = Math.floor(diffMs / (1000 * 60 * 60));
//     }

//     // 4) เตรียมค่าอาหาร และ assessment_id ที่ใช้จริง
//     const foods = input.event_format === "Onsite" ? input.foodIds : [];
//     const aid =
//       input.event_format !== "Course" && input.activity_status === "Public"
//         ? input.assessment_id
//         : undefined;

//     // 5) แยก floor ออก เพื่อไม่ให้ลงใน Partial<Activity>
//     const { floor, foodIds, ...activityData } = input;

//     // 6) สร้าง updatedData สำหรับ ActivityDao
//     const updatedData: Partial<Activity> = {
//       ...activityData,
//       seat:
//         input.event_format === "Online" ? input.seat ?? undefined : undefined,
//       recieve_hours: hrs ?? undefined,
//       assessment_id: aid,
//       room_id:
//         input.event_format === "Onsite"
//           ? input.room_id ?? undefined
//           : undefined,

//       special_start_register_date:
//         input.special_start_register_date ?? undefined,
//       start_register_date: input.start_register_date ?? undefined,
//       end_register_date: input.end_register_date ?? undefined,
//       start_activity_date: input.start_activity_date ?? undefined,
//       end_activity_date: input.end_activity_date ?? undefined,

//       last_update_activity_date: new Date(),
//       url: input.url ?? undefined,
//       event_format: input.event_format,
//       activity_status: input.activity_status,
//       activity_state: input.activity_state,
//       status: input.status,
//       create_activity_date: input.create_activity_date,
//     };

//     // 7) เรียก DAO เพื่ออัปเดต Activity + ActivityFood
//     const updated = await this.activityDao.updateActivityDao(
//       activity_id,
//       updatedData,
//       foods
//     );

//     // 8) ถ้าเป็น Onsite และ client ส่ง floor มา → อัปเดต floor ของห้อง
//     if (input.event_format === "Onsite" && input.room_id && floor) {
//       await this.roomService.updateRoomFloor(input.room_id, floor.trim());
//     }

//     // 9) ล้าง cache และคืนผล
//     await redis.del("activity:all");
//     this.logInfo("✏️ Activity updated", { activity_id });
//     return updated;
//   }

//   public async softDeleteActivity(
//     activity_id: number
//   ): Promise<Activity | null> {
//     try {
//       const activity = await this.activityDao.findById(activity_id);
//       if (!activity) return null;

//       activity.status = "Inactive";
//       const updated = await this.activityDao.save(activity);
//       await redis.del("activity:all");

//       this.logInfo("🗑️ Activity soft deleted", { activity_id });
//       return updated;
//     } catch (error) {
//       this.logError("❌ Error in softDeleteActivity", error);
//       throw error;
//     }
//   }

//   public async hardDeleteActivity(activity_id: number): Promise<boolean> {
//     try {
//       const activity = await this.activityDao.findById(activity_id);
//       if (!activity) return false;

//       await this.activityDao.delete(activity_id);
//       await redis.del("activity:all");

//       this.logInfo("🗑️ Activity hard deleted", { activity_id });
//       return true;
//     } catch (error) {
//       this.logError("❌ Error in hardDeleteActivity", error);
//       throw error;
//     }
//   }

// }

// ------------------------------------------------------------------------------------

// import { ActivityDao } from "../../daos/Teacher/activity.dao.newstructure";
// import { Activity } from "../../entity/activity.entity";
// import redis from "../../config/redis";
// import { ErrorHandledService } from "../error.handdled.service";
// import { RoomService } from "./room.service";

// export class ActivityService extends ErrorHandledService {
//   private readonly activityDao = new ActivityDao();
//   private readonly roomService = new RoomService();

//   public async createActivity(input: Activity): Promise<Activity> {
//     try {
//       const { foodIds, floor, ...activityData } = input as any;

//       const sanitizedData: Partial<Activity> = {
//         ...activityData,
//         seat: input.seat ?? undefined,
//         recieve_hours: input.recieve_hours ?? undefined,
//         special_start_register_date:
//           input.special_start_register_date ?? undefined,
//         start_register_date: input.start_register_date ?? undefined,
//         end_register_date: input.end_register_date ?? undefined,
//         start_activity_date: input.start_activity_date ?? undefined,
//         end_activity_date: input.end_activity_date ?? undefined,
//         url: input.url ?? undefined,
//         room_id: input.room_id ?? undefined,
//         create_activity_date: new Date(),
//         last_update_activity_date: new Date(),
//       };

//       const created = await this.activityDao.createActivityDao(
//         sanitizedData,
//         input.activityFood ?? []
//       );

//       await redis.del("activity:all");

//       this.logInfo("🆕 Activity created", {
//         activity_name: created.activity_name,
//         activity_id: created.activity_id,
//       });

//       return created;
//     } catch (error) {
//       this.logError("❌ Error in createActivity", error);
//       throw error;
//     }
//   }

//   public async getAllActivities(): Promise<Activity[]> {
//     const cacheKey = "activity:all";

//     try {
//       const cached = await redis.get(cacheKey);
//       if (cached) {
//         this.logInfo("📦 Returning cached activity data");
//         return JSON.parse(cached);
//       }

//       const activities = await this.activityDao.getAllActivitiesDao();
//       await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);

//       this.logInfo("📤 Activity data retrieved and cached", {
//         count: activities.length,
//       });

//       return activities;
//     } catch (error) {
//       this.logError("❌ Error in getAllActivities", error);
//       throw error;
//     }
//   }

//   public async updateActivity(
//     activity_id: number,
//     input: Activity
//   ): Promise<Activity | null> {
//     const existing = await this.activityDao.findById(activity_id);
//     if (!existing) return null;

//     if (input.activity_status === "Public") {
//       if (
//         input.special_start_register_date &&
//         input.special_start_register_date >= input.start_activity_date!
//       ) {
//         throw new Error(
//           "special_start_register_date ต้องน้อยกว่า start_activity_date"
//         );
//       }
//       if (
//         input.start_register_date &&
//         input.start_register_date >= input.start_activity_date!
//       ) {
//         throw new Error("start_register_date ต้องน้อยกว่า start_activity_date");
//       }
//       if (
//         input.end_register_date &&
//         input.start_register_date &&
//         input.end_register_date <= input.start_register_date
//       ) {
//         throw new Error("end_register_date ต้องมากกว่า start_register_date");
//       }
//       if (
//         input.end_activity_date &&
//         input.start_activity_date &&
//         input.end_activity_date <= input.start_activity_date
//       ) {
//         throw new Error("end_activity_date ต้องมากกว่า start_activity_date");
//       }
//     }

//     let hrs = input.recieve_hours;
//     if (
//       input.activity_status === "Public" &&
//       input.event_format !== "Course" &&
//       input.start_activity_date &&
//       input.end_activity_date
//     ) {
//       const diffMs =
//         new Date(input.end_activity_date).getTime() -
//         new Date(input.start_activity_date).getTime();
//       hrs = Math.floor(diffMs / (1000 * 60 * 60));
//     }

//     const foods = input.event_format === "Onsite" ? input.activityFood ?? [] : [];
//     const aid =
//       input.event_format !== "Course" && input.activity_status === "Public"
//         ? input.assessment_id
//         : undefined;

//     const updatedData: Partial<Activity> = {
//       ...input,
//       seat:
//         input.event_format === "Online" ? input.seat ?? undefined : undefined,
//       recieve_hours: hrs ?? undefined,
//       assessment_id: aid,
//       room_id:
//         input.event_format === "Onsite"
//           ? input.room_id ?? undefined
//           : undefined,
//       special_start_register_date:
//         input.special_start_register_date ?? undefined,
//       start_register_date: input.start_register_date ?? undefined,
//       end_register_date: input.end_register_date ?? undefined,
//       start_activity_date: input.start_activity_date ?? undefined,
//       end_activity_date: input.end_activity_date ?? undefined,
//       last_update_activity_date: new Date(),
//       url: input.url ?? undefined,
//       create_activity_date: input.create_activity_date ?? new Date(),
//     };

//     const updated = await this.activityDao.updateActivityDao(
//       activity_id,
//       updatedData,
//       foods
//     );

//     if (input.event_format === "Onsite" && input.room_id && input.floor) {
//       await this.roomService.updateRoomFloor(input.room_id, input.floor.trim());
//     }

//     await redis.del("activity:all");
//     this.logInfo("✏️ Activity updated", { activity_id });
//     return updated;
//   }

//   public async softDeleteActivity(
//     activity_id: number
//   ): Promise<Activity | null> {
//     try {
//       const activity = await this.activityDao.findById(activity_id);
//       if (!activity) return null;

//       activity.status = "Inactive";
//       const updated = await this.activityDao.save(activity);
//       await redis.del("activity:all");

//       this.logInfo("🗑️ Activity soft deleted", { activity_id });
//       return updated;
//     } catch (error) {
//       this.logError("❌ Error in softDeleteActivity", error);
//       throw error;
//     }
//   }

//   public async hardDeleteActivity(activity_id: number): Promise<boolean> {
//     try {
//       const activity = await this.activityDao.findById(activity_id);
//       if (!activity) return false;

//       await this.activityDao.delete(activity_id);
//       await redis.del("activity:all");

//       this.logInfo("🗑️ Activity hard deleted", { activity_id });
//       return true;
//     } catch (error) {
//       this.logError("❌ Error in hardDeleteActivity", error);
//       throw error;
//     }
//   }
// }
// ------------------------------------------------------------------------------------

import { ActivityDao } from "../../daos/Teacher/activity.dao.newstructure";
import { Activity } from "../../entity/activity.entity";
import redis from "../../config/redis";
import { ErrorHandledService } from "../error.handdled.service";
import { RoomService } from "./room.service";

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
    if (!existing) return null;

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
    const aid =
      input.event_format !== "Course" && input.activity_status === "Public"
        ? input.assessment_id
        : undefined;

    const updatedData: Partial<Activity> = {
      ...input,
      seat:
        input.event_format === "Online" ? input.seat ?? undefined : undefined,
      recieve_hours: hrs ?? undefined,
      assessment_id: aid,
      room_id:
        input.event_format === "Onsite"
          ? input.room_id ?? undefined
          : undefined,
      special_start_register_date:
        input.special_start_register_date ?? undefined,
      start_register_date: input.start_register_date ?? undefined,
      end_register_date: input.end_register_date ?? undefined,
      start_activity_date: input.start_activity_date ?? undefined,
      end_activity_date: input.end_activity_date ?? undefined,
      last_update_activity_date: new Date(),
      url: input.url ?? undefined,
      create_activity_date: input.create_activity_date ?? new Date(),
    };

    const updated = await this.activityDao.updateActivityDao(
      activity_id,
      updatedData,
      foods
    );

    if (input.event_format === "Onsite" && input.room_id && input.floor) {
      await this.roomService.updateRoomFloor(input.room_id, input.floor.trim());
    }

    await redis.del("activity:all");
    this.logInfo("✏️ Activity updated", { activity_id });
    return updated;
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
