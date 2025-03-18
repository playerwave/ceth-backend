import { Repository } from "typeorm";
import { connectDatabase } from "../../db/database";
import { Activity } from "../../entity/Activity";
import logger from "../../middleware/logger";

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

  async getAllActivitiesDao(userId: number): Promise<Activity[]> {
    this.checkRepository();

    try {
      logger.info(
        "📌 Fetching all public activities that user has not registered for"
      );

      // ดึงกิจกรรมที่ ac_status เป็น 'public' และไม่มี user ลงทะเบียน
      return await this.activityRepository!.createQueryBuilder("activity")
        .leftJoin("activity.userActivities", "user_activity") // เชื่อมโยงกับ user_activity
        .where("activity.ac_status = :status", { status: "Public" }) // กรองแค่ public
        .andWhere(
          "user_activity.u_id IS NULL OR user_activity.u_id != :userId",
          { userId }
        ) // กรองแค่กิจกรรมที่ userId ยังไม่ได้ลงทะเบียน
        .getMany();
    } catch (error) {
      logger.error("❌ Error in getAllActivities(Admin):", error);
      throw new Error("Failed to get all activities");
    }
  }
}
