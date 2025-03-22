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
      const activity = this.activityRepository!.create(activityData);
      logger.info("📌 Creating activity:", activityData);

      return await this.activityRepository!.save(activity);
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
  //     const existingActivity = await this.activityRepository!.findOne({
  //       where: { ac_id: activityId },
  //     });

  //     if (!existingActivity) {
  //       throw new Error(`Activity with ID ${activityId} not found`);
  //     }

  //     Object.assign(existingActivity, activityData);
  //     return await this.activityRepository!.save(existingActivity);
  //   } catch (error) {
  //     logger.error("❌ Error in updateActivityDao(Admin):", error);
  //     throw new Error("Failed to update activity");
  //   }
  // }

  async updateActivityDao(
    activityId: number,
    activityData: Partial<Activity>,
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

      // ✅ กำหนด `ac_id` ให้แน่ใจว่าอัปเดตข้อมูลเดิม ไม่สร้างใหม่
      activityData.ac_id = activityId;

      Object.assign(existingActivity, activityData);

      console.log("🔄 Final Data before Saving:", existingActivity);

      // ✅ ใช้ `save()` โดยกำหนด explicit `ac_id`
      const updatedActivity =
        await this.activityRepository!.save(existingActivity);

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
        "activity",
      )
        .leftJoinAndSelect("activity.assessment", "assessment") // ✅ ดึง assessment ด้วย
        .where("activity.ac_id = :id", { id: activityId })
        .getOne();

      console.log("🟢 DAO Response:", JSON.stringify(activity, null, 2)); // ✅ ตรวจสอบข้อมูลที่ถูกดึงมา

      return activity;
    } catch (error) {
      logger.error(
        `❌ Error in getActivityByIdDao(Admin) ${activityId}:`,
        error,
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
        `🧹 Deleted all UserActivity rows with activityId ${activityId}`,
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
    ac_status: string,
  ): Promise<Activity | null> {
    this.checkRepository();

    const status = ac_status.trim().toLowerCase();
    if (status !== "public" && status !== "private") {
      throw new Error(
        "ค่าที่ส่งเข้ามาที่ ac_status ไม่ใช่ 'Public' หรือ 'Private'",
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
}
