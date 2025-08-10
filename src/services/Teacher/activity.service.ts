import { ActivityDao } from "../../daos/Teacher/activity.dao.newstructure";
import { AssessmentDao } from "../../daos/Teacher/assessment.dao";
import { Activity } from "../../entity/activity.entity";
import { Assessment } from "../../entity/assessment.entity";
import redis from "../../config/redis";
import { ErrorHandledService } from "../error.handdled.service";
import { RoomService } from "./room.service";
import { convertDateFieldsToLocal } from "../../utils/convertDateFieldsToLocal";

export class ActivityService extends ErrorHandledService {
  private readonly activityDao = new ActivityDao();
  private readonly assessmentDao = new AssessmentDao();
  private readonly roomService = new RoomService();

  public async createActivity(
    input: Activity & { foodIds?: number[]; floor?: string }
  ): Promise<Activity> {
    try {
      const { foodIds, floor, ...activityData } = input;

      // ดึงข้อมูล Assessment ถ้ามี assessment_id
      let assessmentData: Assessment | null = null;
      if (input.assessment_id) {
        try {
          const assessments = await this.assessmentDao.getAssessmentByID(
            input.assessment_id
          );
          assessmentData = assessments.length > 0 ? assessments[0] : null;
          console.log("🔍 Assessment data found:", assessmentData);
        } catch (error) {
          console.error("❌ Error fetching assessment:", error);
        }
      }

      const sanitizedData: Partial<Activity> = {
        ...activityData,
        activity_name: input.activity_name || "ไม่ระบุ",
        presenter_company_name: input.presenter_company_name || "ไม่ระบุ",
        description: input.description || "ไม่ระบุ",
        seat: input.seat ?? 0,
        recieve_hours: input.recieve_hours ?? 0,
        special_start_register_date:
          input.special_start_register_date ?? new Date(),
        start_register_date: input.start_register_date ?? new Date(),
        end_register_date: input.end_register_date ?? new Date(),
        start_activity_date: input.start_activity_date ?? new Date(),
        end_activity_date: input.end_activity_date ?? new Date(),
        // Set assessment dates from input (prioritize input over assessment data)
        start_assessment: input.start_assessment ?? null,
        end_assessment: input.end_assessment ?? null,
        url: input.url || "ไม่ระบุ",
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

    // ดึงข้อมูล Assessment ถ้ามี assessment_id
    let assessmentData: Assessment | null = null;
    if (input.assessment_id) {
      try {
        const assessments = await this.assessmentDao.getAssessmentByID(
          input.assessment_id
        );
        assessmentData = assessments.length > 0 ? assessments[0] : null;
        console.log("🔍 Assessment data found for update:", assessmentData);
      } catch (error) {
        console.error("❌ Error fetching assessment for update:", error);
      }
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

    console.log("🍽️ Service: Food assignment", {
      event_format: input.event_format,
      foodIds: input.foodIds,
      foods: foods,
    });

    const localInput = convertDateFieldsToLocal({
      ...input,
      last_update_activity_date: new Date(),
      create_activity_date: input.create_activity_date ?? new Date(),
    });

    const updatedData: Partial<Activity> = {
      ...localInput,
      recieve_hours: hrs ?? undefined,
      seat: input.seat ?? 0,
      assessment_id: input.assessment_id || null, // ✅ ใช้ null แทน undefined
      // Set assessment dates from input (prioritize input over assessment data)
      start_assessment: input.start_assessment ?? null,
      end_assessment: input.end_assessment ?? null,
      room_id: input.event_format === "Onsite" ? input.room_id || null : null, // ✅ ใช้ null แทน undefined
      url: input.url ?? undefined,
    };

    this.logInfo("🔧 Prepared updatedData (local time applied)", updatedData);
    console.log("🔍 Service: Final values for DAO:", {
      assessment_id: updatedData.assessment_id,
      room_id: updatedData.room_id,
      assessment_id_type: typeof updatedData.assessment_id,
      room_id_type: typeof updatedData.room_id,
    });

    console.log("🍽️ Service: Calling updateActivityDao with foods:", foods);
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

  // 1. Not Start → Special Open Register / Open Register
public async updateNotStartActivities(): Promise<void> {
  this.logInfo('[updateNotStartActivities] Checking activities to transition from "Not Start" to "Special Open Register" or "Open Register".');
  const activitiesToUpdate = await this.activityDao.findActivitiesNotStart(); // Finds activities that are in a 'Not Start' state and should transition
  if (activitiesToUpdate.length === 0) {
    this.logInfo('No activities to update from "Not Start" state.');
    return;
  }
  for (const activity of activitiesToUpdate) {
    // This logic needs to be based on your business rules for special vs. regular open register
    // For now, let's assume they all move to 'Open Register' for simplicity
    await this.activityDao.updateActivityState(activity.activity_id, 'Open Register');
    this.logInfo(`[updateNotStartActivities] Updated activity ${activity.activity_id} to 'Open Register'.`);
  }
}

// 2. Special Open Register → Open Register
public async updateSpecialOpenRegisterActivities(): Promise<void> {
  this.logInfo('[updateSpecialOpenRegisterActivities] Checking activities to transition from "Special Open Register" to "Open Register".');
  const activitiesToUpdate = await this.activityDao.findActivitiesSpecialOpenRegister();
  if (activitiesToUpdate.length === 0) {
    this.logInfo('No activities to update from "Special Open Register" state.');
    return;
  }
  for (const activity of activitiesToUpdate) {
    await this.activityDao.updateActivityState(activity.activity_id, 'Open Register');
    this.logInfo(`[updateSpecialOpenRegisterActivities] Updated activity ${activity.activity_id} to 'Open Register'.`);
  }
}

// 3. Open Register → Close Register
public async updateOpenRegisterActivities(): Promise<void> {
  this.logInfo('[updateOpenRegisterActivities] Checking activities to transition from "Open Register" to "Close Register".');
  const activitiesToUpdate = await this.activityDao.findActivitiesOpenRegister();
  if (activitiesToUpdate.length === 0) {
    this.logInfo('No activities to update from "Open Register" state.');
    return;
  }
  for (const activity of activitiesToUpdate) {
    await this.activityDao.updateActivityState(activity.activity_id, 'Close Register');
    this.logInfo(`[updateOpenRegisterActivities] Updated activity ${activity.activity_id} to 'Close Register'.`);
  }
}

// 4. Close Register → Start Activity
public async updateCloseRegisterActivities(): Promise<void> {
  this.logInfo('[updateCloseRegisterActivities] Checking activities to transition from "Close Register" to "Start Activity".');
  const activitiesToUpdate = await this.activityDao.findActivitiesCloseRegister();
  if (activitiesToUpdate.length === 0) {
    this.logInfo('No activities to update from "Close Register" state.');
    return;
  }
  for (const activity of activitiesToUpdate) {
    await this.activityDao.updateActivityState(activity.activity_id, 'Start Activity');
    this.logInfo(`[updateCloseRegisterActivities] Updated activity ${activity.activity_id} to 'Start Activity'.`);
  }
}

// 5. Start Activity → End Activity
public async updateStartActivityActivities(): Promise<void> {
  this.logInfo('[updateStartActivityActivities] Checking activities to transition from "Start Activity" to "End Activity".');
  const activitiesToUpdate = await this.activityDao.findActivitiesStartActivity();
  if (activitiesToUpdate.length === 0) {
    this.logInfo('No activities to update from "Start Activity" state.');
    return;
  }
  for (const activity of activitiesToUpdate) {
    await this.activityDao.updateActivityState(activity.activity_id, 'End Activity');
    this.logInfo(`[updateStartActivityActivities] Updated activity ${activity.activity_id} to 'End Activity'.`);
  }
}

// 6. End Activity → Start Assessment (3 วันหลัง End Activity)
public async updateEndActivityActivities(): Promise<void> {
  this.logInfo('[updateEndActivityActivities] Checking activities to transition from "End Activity" to "Start Assessment".');
  const activitiesToUpdate = await this.activityDao.findActivitiesEndActivity();
  if (activitiesToUpdate.length === 0) {
    this.logInfo('No activities to update from "End Activity" state.');
    return;
  }
  for (const activity of activitiesToUpdate) {
    await this.activityDao.updateActivityState(activity.activity_id, 'Start Assessment');
    this.logInfo(`[updateEndActivityActivities] Updated activity ${activity.activity_id} to 'Start Assessment'.`);
  }
}

// 7. Start Assessment → End Assessment (3 วันหลัง Start Assessment)
public async updateStartAssessmentActivities(): Promise<void> {
  this.logInfo('[updateStartAssessmentActivities] Checking activities to transition from "Start Assessment" to "End Assessment".');
  const activitiesToUpdate = await this.activityDao.findActivitiesStartAssessment();
  if (activitiesToUpdate.length === 0) {
    this.logInfo('No activities to update from "Start Assessment" state.');
    return;
  }
  for (const activity of activitiesToUpdate) {
    await this.activityDao.updateActivityState(activity.activity_id, 'End Assessment');
    this.logInfo(`[updateStartAssessmentActivities] Updated activity ${activity.activity_id} to 'End Assessment'.`);
  }
}

// 8. End Assessment → (ไม่เปลี่ยน state ต่อ)
// This function is now correctly empty as the state is 'End Assessment'
// and there is no subsequent state change defined.

// ฟังก์ชันรวม
public async autoUpdateActivityStates() {
  await this.updateNotStartActivities();
  await this.updateSpecialOpenRegisterActivities();
  await this.updateOpenRegisterActivities();
  await this.updateCloseRegisterActivities();
  await this.updateStartActivityActivities();
  await this.updateEndActivityActivities();
  await this.updateStartAssessmentActivities();
  // We can skip the final End Assessment, as per the comment above.
}

  // ✅ เพิ่ม search method
  public async searchActivities(searchTerm: string): Promise<Activity[]> {
    try {
      return await this.activityDao.searchActivities(searchTerm);
    } catch (error) {
      this.logError("❌ Error searching activities", error);
      throw error;
    }
  }
}
