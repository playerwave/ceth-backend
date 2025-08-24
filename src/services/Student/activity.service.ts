import { ActivityDao } from "../../daos/Student/activity.dao";
import { Activity } from "../../entity/activity.entity";
import { Join } from "../../entity/join.entity";
import redis from "../../config/redis";
import { ErrorHandledService } from "../error.handdled.service";

export class ActivityService extends ErrorHandledService {
  private readonly activityDao = new ActivityDao();

  public async getStudentActivitiesService(
    studentId: number
  ): Promise<Activity[]> {
    try {
      const activities = await this.activityDao.getAvailableActivities(
        studentId
      );
      this.logInfo("📄 Retrieved student-available activities", {
        studentId,
        count: activities.length,
      });
      return activities;
    } catch (error) {
      this.logError("❌ Error in getStudentActivitiesService", error);
      throw error;
    }
  }

  public async getActivityByIdService(
    activityId: number,
    studentId: number | null
  ): Promise<Activity | null> {
    try {
      const activity = await this.activityDao.findActivityWithJoinStatus(
        activityId,
        studentId
      );
      if (!activity) return null;

      this.logInfo("🔍 Retrieved activity by ID", { activityId, studentId });
      return activity;
    } catch (error) {
      this.logError("❌ Error in getActivityByIdService", error);
      throw error;
    }
  }

  // public async studentEnrollActivityService(
  //   studentId: number,
  //   activityId: number,
  //   foodChoices: string[]
  // ): Promise<Join> {
  //   try {
  //     // 1. หา activity_detail_id จาก activityId
  //     const activityDetailResult =
  //       await this.activityDao.getActivityDetailIdByActivityId(activityId);
  //     const activityDetailId = activityDetailResult?.activity_detail_id;
  //     if (!activityDetailId) throw new Error("Activity detail not found");

  //     // 2. ตรวจสอบว่าสมัครซ้ำหรือยัง
  //     const existing = await this.joinDao.findJoinByStudentAndActivity(
  //       studentId,
  //       activityDetailId
  //     );
  //     if (existing) throw new Error("Already enrolled in this activity");

  //     // 3. สร้าง join ใหม่
  //     const join = await this.joinDao.createJoin(
  //       studentId,
  //       activityDetailId,
  //       foodChoices
  //     );

  //     await redis.del(`join:${studentId}`);
  //     this.logInfo("✅ Student enrolled in activity", {
  //       studentId,
  //       activityId,
  //     });
  //     return join;
  //   } catch (error) {
  //     this.logError("❌ Error in studentEnrollActivityService", error);
  //     throw error;
  //   }
  // }

  // public async studentEnrollActivityService(
  //   studentId: number,
  //   activityId: number,
  //   foodChoices: string[]
  // ): Promise<Join> {
  //   try {
  //     // ใช้ฟังก์ชันใหม่
  //     const activityDetailResult =
  //       await this.activityDao.getAvailableActivityDetailId(activityId, studentId);
  //     const activityDetailId = activityDetailResult?.activity_detail_id;
  //     if (!activityDetailId) throw new Error("Activity detail not found");

  //     // ตรวจสอบว่าสมัครซ้ำหรือยัง
  //     const existing = await this.joinDao.findJoinByStudentAndActivity(
  //       studentId,
  //       activityDetailId
  //     );
  //     if (existing) throw new Error("Already enrolled in this activity");

  //     // สร้าง join ใหม่ (ต้องแก้ createJoin ให้รับ activityDetailId)
  //     const join = await this.joinDao.createJoin(
  //       studentId,
  //       activityDetailId,
  //       foodChoices // หรือ teacherId ถ้าต้องการ
  //     );

  //     await redis.del(`join:${studentId}`);
  //     this.logInfo("✅ Student enrolled in activity", {
  //       studentId,
  //       activityId,
  //     });
  //     return join;
  //   } catch (error) {
  //     this.logError("❌ Error in studentEnrollActivityService", error);
  //     throw error;
  //   }
  // }

  public async studentEnrollActivityService(
    studentId: number,
    activityId: number,
    foodChoices: string[]
  ): Promise<Join> {
    try {
      // 1. ตรวจสอบว่าสมัครซ้ำหรือยัง
      const existingJoin = await this.activityDao.findJoinByStudentAndActivityId(
        studentId,
        activityId
      );
      if (existingJoin) throw new Error("Already enrolled in this activity");

      // 2. สร้าง activity_detail ใหม่
      const activityDetail = await this.activityDao.createActivityDetail(
        activityId,
        0, // ไม่ใช้ join_id
        foodChoices
      );

      // 3. สร้าง join ใหม่ (ใช้ activity_detail_id ที่เพิ่งสร้าง)
      const join = await this.activityDao.createJoin(
        studentId,
        activityDetail.activity_detail_id,
        foodChoices
      );

      // 4. ลบ cache
      await redis.del(`join:${studentId}`);

      // 5. ตรวจสอบ registered_count หลังจากลงทะเบียน
      const finalCount = await this.activityDao.getActivityInfo(activityId);

      this.logInfo("✅ Student enrolled in activity", {
        studentId,
        activityId,
        joinId: join.join_id,
        activityDetailId: activityDetail.activity_detail_id,
        registeredCount: finalCount?.registered_count || 0,
        totalSeats: finalCount?.seat || 0,
        remainingSeats: (finalCount?.seat || 0) - (finalCount?.registered_count || 0)
      });
      return join;
    } catch (error) {
      this.logError("❌ Error in studentEnrollActivityService", error);
      throw error;
    }
  }

  public async getActivityHistoryByStudentsID(students_id: number): Promise<Activity[]> {
    const cacheKey = "activity:all";

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached activity data");
        return JSON.parse(cached);
      }

      const activities = await this.activityDao.getActivityHistoryByStudentsID(students_id);
      await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);

      this.logInfo("📤 Activity data retrieved and cached", {
        count: activities.length,
      });

      return activities;
    } catch (error) {
      this.logError("❌ Error in getActivityHistoryByStudentsID", error);
      throw error;
    }
  }

  public async getSearch(students_id: number, text: string): Promise<Activity[]> {
    const cacheKey = "activity:all";

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached activity data");
        return JSON.parse(cached);
      }

      const activities = await this.activityDao.getSearch(students_id, text)
      await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);

      this.logInfo("📤 Activity data retrieved and cached", {
        count: activities.length,
      });

      return activities;
    } catch (error) {
      this.logError("❌ Error in getSearch", error);
      throw error;
    }
  }

  public async getEnrolledActivitiesService(
    studentId: number
  ): Promise<Activity[]> {
    try {
      const cacheKey = `join:${studentId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached enrolled activities", { studentId });
        return JSON.parse(cached);
      }

      const activities = await this.activityDao.getEnrolledActivities(
        studentId
      );
      await redis.set(cacheKey, JSON.stringify(activities), "EX", 60);

      this.logInfo("📤 Retrieved and cached enrolled activities", {
        studentId,
        count: activities.length,
      });
      return activities;
    } catch (error) {
      this.logError("❌ Error in getEnrolledActivitiesService", error);
      throw error;
    }
  }

  public async searchActivityService(ac_name: string): Promise<Activity[]> {
    try {
      const results = await this.activityDao.searchActivitiesByName(ac_name);
      this.logInfo("🔍 Searched activities by name", {
        ac_name,
        count: results.length,
      });
      return results;
    } catch (error) {
      this.logError("❌ Error in searchActivityService", error);
      throw error;
    }
  }

  public async unEnrollActivityService(
    studentId: number,
    activityId: number
  ): Promise<boolean> {
    try {
      // ใช้ cancelEnrollment เพื่อเปลี่ยน status เป็น Cancelled แทนการลบ
      const success = await this.activityDao.cancelEnrollment(studentId, activityId);

      if (success) {
        // ลบ cache ของรายการ join ของนิสิต
        await redis.del(`join:${studentId}`);

        this.logInfo("🚫 Student unenrolled from activity (status changed to Cancelled)", {
          studentId,
          activityId,
        });
      }

      return success;
    } catch (error) {
      this.logError("❌ Error in unEnrollActivityService", error);
      throw error;
    }
  }

  // public async unEnrollActivityService(
  //   studentId: number,
  //   activityId: number
  // ): Promise<boolean> {
  //   try {
  //     const ok = await this.activityDao.cancelEnrollment(studentId, activityId);

  //     // ลบ cache ของรายการ join ของนิสิต (ถ้ามี)
  //     await redis.del(`join:${studentId}`);

  //     this.logInfo("🚪 Student unenrolled from activity", {
  //       studentId,
  //       activityId,
  //       success: ok,
  //     });

  //     return ok;
  //   } catch (error) {
  //     this.logError("❌ Error in unEnrollActivityService", error);
  //     throw error;
  //   }
  // }

  // เพิ่มเมธอดสำหรับรีเซ็ต registered_count ทั้งหมด
  public async resetAllRegisteredCountsService(): Promise<void> {
    try {
      await this.activityDao.resetAllRegisteredCounts();
      this.logInfo("🔄 Reset all registered counts completed");
    } catch (error) {
      this.logError("❌ Error in resetAllRegisteredCountsService", error);
      throw error;
    }
  }
}
