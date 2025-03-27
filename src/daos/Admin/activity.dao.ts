import { Repository, getRepository } from "typeorm";
import { connectDatabase } from "../../db/database";
import { Activity } from "../../entity/Activity";
import logger from "../../middleware/logger";
import { UserActivity } from "../../entity/UserActivity";

export class ActivityDao {
  private activityRepository: Repository<Activity> | null = null;

  constructor() {
    this.initializeRepository();
  }

  // ✅ ใช้ async function เพื่อรอการเชื่อมต่อฐานข้อมูล
  private async initializeRepository(): Promise<void> {
    try {
      const connection = await connectDatabase();
      this.activityRepository = connection.getRepository(Activity);
      console.log("✅ Activity Repository initialized");
    } catch (error) {
      console.error("❌ Error initializing ActivityDao(Admin):", error);
    }
  }

  private checkRepository(): void {
    if (!this.activityRepository) {
      throw new Error("Database connection is not established");
    }
  }

  async createActivityDao(activityData: Partial<Activity>): Promise<Activity> {
    this.checkRepository();
    try {
      // ✅ ถ้า ac_food เป็น string ให้แปลงเป็น array
      if (typeof activityData.ac_food === "string") {
        try {
          activityData.ac_food = JSON.parse(activityData.ac_food);
        } catch (error) {
          logger.warn("⚠ ac_food format is invalid, setting as empty array.");
          activityData.ac_food = [];
        }
      }

      // ✅ ถ้า ac_food ไม่ใช่ array ให้ตั้งค่าเป็น []
      if (!Array.isArray(activityData.ac_food)) {
        activityData.ac_food = [];
      }

      const activity = this.activityRepository!.create(activityData);
      logger.info("📌 Creating activity:", activityData);

      const savedActivity = await this.activityRepository!.save(activity);

      // ✅ แปลง ac_food กลับเป็น array (เผื่อ DB บันทึกเป็น JSON string)
      if (typeof savedActivity.ac_food === "string") {
        savedActivity.ac_food = JSON.parse(savedActivity.ac_food);
      } else if (!Array.isArray(savedActivity.ac_food)) {
        savedActivity.ac_food = [];
      }

      return savedActivity;
    } catch (error) {
      logger.error("❌ Error in createActivityDao(Admin):", error);
      throw new Error("Failed to create activity");
    }
  }

  // async updateActivityDao(
  //   activityId: number,
  //   activityData: Partial<Activity>
  // ): Promise<Activity> {
  //   this.checkRepository();

  //   try {
  //     logger.info("🔄 Updating activity with ID:", activityId);
  //     console.log("🛠️ Received activityId in DAO:", activityId);

  //     const existingActivity = await this.activityRepository!.findOne({
  //       where: { ac_id: activityId },
  //       relations: ["assessment"], // ✅ โหลด relation เพื่อป้องกันปัญหาการสร้างใหม่
  //     });

  //     if (!existingActivity) {
  //       console.error(`❌ Activity with ID ${activityId} not found in DB`);
  //       throw new Error(`Activity with ID ${activityId} not found`);
  //     }

  //     console.log("✅ Found existing activity:", existingActivity);

  //     // ✅ กำหนด `ac_id` ให้แน่ใจว่าอัปเดตข้อมูลเดิม ไม่สร้างใหม่
  //     activityData.ac_id = activityId;

  //     Object.assign(existingActivity, activityData);

  //     console.log("🔄 Final Data before Saving:", existingActivity);

  //     // ✅ ใช้ `save()` โดยกำหนด explicit `ac_id`
  //     const updatedActivity = await this.activityRepository!.save(
  //       existingActivity
  //     );

  //     console.log("✅ Successfully updated activity:", updatedActivity);
  //     return updatedActivity;
  //   } catch (error) {
  //     logger.error("❌ Error in updateActivityDao(Admin):", error);
  //     throw new Error("Failed to update activity");
  //   }
  // }

  async updateActivityDao(
    activityId: number,
    activityData: Partial<Activity>
  ): Promise<Activity> {
    this.checkRepository();

    try {
      logger.info("🔄 Updating activity with ID:", activityId);
      console.log("🛠️ Received activityId in DAO:", activityId);

      const existingActivity = await this.activityRepository!.findOne({
        where: { ac_id: activityId },
        relations: ["assessment"], // ✅ โหลด relation เพื่อป้องกันปัญหาการสร้างใหม่
      });

      if (!existingActivity) {
        console.error(`❌ Activity with ID ${activityId} not found in DB`);
        throw new Error(`Activity with ID ${activityId} not found`);
      }

      console.log("✅ Found existing activity:", existingActivity);

      // ✅ ตรวจสอบว่า ac_food มีค่าหรือไม่
      if (activityData.ac_food) {
        if (typeof activityData.ac_food === "string") {
          if (
            (activityData.ac_food as string).startsWith("[") &&
            (activityData.ac_food as string).endsWith("]")
          ) {
            try {
              activityData.ac_food = JSON.parse(activityData.ac_food);
            } catch (error) {
              logger.warn(
                "⚠ ac_food JSON parse failed, setting as empty array."
              );
              activityData.ac_food = [];
            }
          } else {
            activityData.ac_food = [activityData.ac_food];
          }
        }

        if (!Array.isArray(activityData.ac_food)) {
          activityData.ac_food = [];
        }
      } else {
        activityData.ac_food = [];
      }

      // ✅ กำหนด `ac_id` ให้แน่ใจว่าอัปเดตข้อมูลเดิม ไม่สร้างใหม่
      activityData.ac_id = activityId;

      Object.assign(existingActivity, activityData);

      console.log("🔄 Final Data before Saving:", existingActivity);

      // ✅ ใช้ `save()` โดยกำหนด explicit `ac_id`
      const updatedActivity = await this.activityRepository!.save(
        existingActivity
      );

      // ✅ ตรวจสอบ `ac_food` หลังบันทึก และแปลงเป็น array ถ้าจำเป็น
      if (typeof updatedActivity.ac_food === "string") {
        try {
          updatedActivity.ac_food = JSON.parse(updatedActivity.ac_food);
        } catch (error) {
          logger.warn("⚠ ac_food JSON parse failed, setting as empty array.");
          updatedActivity.ac_food = [];
        }
      }

      console.log("✅ Successfully updated activity:", updatedActivity);
      return updatedActivity;
    } catch (error) {
      logger.error("❌ Error in updateActivityDao(Admin):", error);
      throw new Error("Failed to update activity");
    }
  }

  async getActivityByIdDao(activityId: number): Promise<Activity | null> {
    this.checkRepository();

    try {
      const activity = await this.activityRepository!.createQueryBuilder(
        "activity"
      )
        .leftJoinAndSelect("activity.assessment", "assessment") // ✅ ใช้ชื่อ relation ที่ถูกต้อง
        // ✅ ใช้ชื่อ relation ที่ถูกต้อง
        // ✅ ดึง assessment ด้วย
        .where("activity.ac_id = :id", { id: activityId })
        .getOne();

      console.log("🟢 DAO Response:", JSON.stringify(activity, null, 2)); // ✅ ตรวจสอบข้อมูลที่ถูกดึงมา

      return activity;
    } catch (error) {
      logger.error(
        `❌ Error in getActivityByIdDao(Admin) ${activityId}:`,
        error
      );
      throw new Error("Failed to get activity by id");
    }
  }

  // async deleteActivityDao(activityId: number): Promise<boolean> {
  //   this.checkRepository();

  //   try {
  //     logger.info("🔄 Attempting to delete activity with ID:", activityId);
  //     const deleteResult = await this.activityRepository!.delete(activityId);

  //     const userActivityRepository = getRepository(UserActivity);

  //     if (deleteResult.affected === 0) {
  //       console.warn(`⚠️ Activity with ID ${activityId} not found.`);
  //       return false;
  //     }

  //     logger.info(`✅ Activity with ID ${activityId} deleted successfully.`);
  //     return true;
  //   } catch (error) {
  //     logger.error("❌ Error in updateActivityDao(Admin):", error);
  //     throw new Error("Failed to update activity");
  //   }
  // }

  async deleteActivityDao(activityId: number): Promise<boolean> {
    this.checkRepository();

    try {
      logger.info("🔄 Attempting to delete activity with ID:", activityId);

      const userActivityRepository = getRepository(UserActivity);

      // ✅ ลบ UserActivity ที่เกี่ยวข้องก่อน
      await userActivityRepository.delete({ activity: { ac_id: activityId } });
      logger.info(
        `🧹 Deleted all UserActivity rows with activityId ${activityId}`
      );

      // ✅ ลบ Activity หลังจากเคลียร์ข้อมูลที่เกี่ยวข้อง
      const deleteResult = await this.activityRepository!.delete(activityId);

      if (deleteResult.affected === 0) {
        console.warn(`⚠️ Activity with ID ${activityId} not found.`);
        return false;
      }

      logger.info(`✅ Activity with ID ${activityId} deleted successfully.`);
      return true;
    } catch (error) {
      logger.error("❌ Error in deleteActivityDao(Admin):", error);
      throw new Error("Failed to delete activity and related data");
    }
  }

  async getAllActivitiesDao(): Promise<Activity[]> {
    this.checkRepository();

    try {
      logger.info("📌 Fetching all activities");
      return await this.activityRepository!.find(); // ❌ เอา pagination ออก
    } catch (error) {
      logger.error("❌ Error in getAllActivities(Admin):", error);
      throw new Error("Failed to get all activity");
    }
  }

  async searchActivityDao(ac_name: string): Promise<Activity[]> {
    this.checkRepository();

    try {
      const query =
        "SELECT * FROM activity WHERE ac_name ILIKE '%' || $1 || '%' ORDER BY ac_id ASC";
      return await this.activityRepository!.query(query, [ac_name]);
    } catch (error) {
      logger.error(`❌ Error in searchActivity:`, error);
      throw new Error(`Error fetching activities: ${error}`);
    }
  }

  async adjustStatusActivityDao(
    ac_id: number,
    ac_status: string
  ): Promise<Activity | null> {
    this.checkRepository();

    const status = ac_status.trim().toLowerCase();
    if (status !== "public" && status !== "private") {
      throw new Error(
        "ค่าที่ส่งเข้ามาที่ ac_status ไม่ใช่ 'Public' หรือ 'Private'"
      );
    }

    try {
      const query = `UPDATE activity SET ac_status = $1, ac_last_update = NOW() WHERE ac_id = $2 RETURNING *`;
      const result = await this.activityRepository!.query(query, [
        ac_status,
        ac_id,
      ]);

      return result.length ? result[0] : null;
    } catch (error) {
      console.error(`❌ Error in adjustStatusActivity:`, error);
      throw new Error(`Error updating activity status: ${error}`);
    }
  }

  async getEnrolledStudentsListDao(activityId: number): Promise<any[]> {
    this.checkRepository();

    try {
      const userActivityRepository = getRepository(UserActivity);

      const enrolledStudents = await userActivityRepository
        .createQueryBuilder("useractivity")
        .innerJoin("useractivity.user", "user")
        .innerJoin("useractivity.activity", "activity") // ✅ ต้อง join activity ก่อนถึงจะใช้เงื่อนไขได้
        .where("activity.ac_id = :activityId", { activityId }) // ✅ ใช้ชื่อ alias ที่ join มา
        .select([
          `"user"."u_id" AS id`,
          `"user"."u_fullname" AS fullname`,
          `"user"."u_std_id" AS studentId`,
          `"user"."u_role" AS role`,
          `"user"."u_soft_hours" AS softHours`,
          `"user"."u_hard_hours" AS hardHours`,
          `"user"."u_risk_soft" AS riskSoft`,
          `"user"."u_risk_hard" AS riskHard`,
          `"user"."u_risk_status" AS riskStatus`,
          `"useractivity"."uac_selected_food" AS selectedFood`,
        ])

        .getRawMany();

      logger.info(
        `✅ Retrieved ${enrolledStudents.length} students for activity ${activityId}`
      );
      console.dir(enrolledStudents, { depth: null });
      return enrolledStudents;
    } catch (error) {
      logger.error("❌ Error in getEnrolledStudentsListDao", { error });
      throw new Error("Failed to fetch enrolled students");
    }
  }
}
