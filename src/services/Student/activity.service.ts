import { ActivityDao } from "../../daos/Student/activity.dao";
import { JoinDao } from "../../daos/join.dao";
import { Activity } from "../../entity/activity.entity";
import { Join } from "../../entity/join.entity";
import redis from "../../config/redis";
import { ErrorHandledService } from "../error.handdled.service";

export class ActivityService extends ErrorHandledService {
  private readonly activityDao = new ActivityDao();
  private readonly joinDao = new JoinDao();

  public async getStudentActivitiesService(
    studentId: number
  ): Promise<Activity[]> {
    try {
      const activities = await this.activityDao.getAvailableActivities(
        studentId
      );
      this.logInfo("📄 Retrieved student-available activities", { studentId });
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
      // 1. หา activity_detail_id ที่ยังไม่มี join สำหรับ student นี้
      const activityDetailResult =
        await this.activityDao.getAvailableActivityDetailId(
          activityId,
          studentId
        );
      const activityDetailId = activityDetailResult?.activity_detail_id;
      if (!activityDetailId) throw new Error("Activity detail not found");

      // 2. ตรวจสอบว่าสมัครซ้ำหรือยัง
      const existing = await this.joinDao.findJoinByStudentAndActivity(
        studentId,
        activityDetailId
      );
      if (existing) throw new Error("Already enrolled in this activity");

      // 3. สร้าง join ใหม่
      const join = await this.joinDao.createJoin(
        studentId,
        activityDetailId,
        foodChoices // หรือ teacherId ถ้าต้องการ
      );

      // 4. ลบ cache
      await redis.del(`join:${studentId}`);
      this.logInfo("✅ Student enrolled in activity", {
        studentId,
        activityId,
      });
      return join;
    } catch (error) {
      this.logError("❌ Error in studentEnrollActivityService", error);
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
      const existing = await this.joinDao.findJoinByStudentAndActivity(
        studentId,
        activityId
      );
      if (!existing) return false;

      await this.joinDao.deleteJoin(existing.join_id);
      await redis.del(`join:${studentId}`);

      this.logInfo("🚫 Student unenrolled from activity", {
        studentId,
        activityId,
      });
      return true;
    } catch (error) {
      this.logError("❌ Error in unEnrollActivityService", error);
      throw error;
    }
  }
}
