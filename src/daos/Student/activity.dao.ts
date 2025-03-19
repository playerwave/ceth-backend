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

      // ใช้ `new Date()` เพื่อให้เป็นเวลาปัจจุบันในการเปรียบเทียบ
      const currentDate = new Date();

      return await this.activityRepository!.createQueryBuilder("activity")
        .leftJoin("activity.userActivities", "user_activity")
        .where("activity.ac_status = 'Public'") // กรองกิจกรรมที่มีสถานะเป็น Public
        .andWhere(
          "(user_activity.u_id IS NULL OR user_activity.u_id != :userId)",
          { userId }
        ) // กรองกิจกรรมที่ userId ยังไม่ได้ลงทะเบียน
        .andWhere(
          "(activity.ac_registered_count < activity.ac_seat OR activity.ac_seat IS NULL OR activity.ac_seat = 0)"
        ) // กรองกิจกรรมที่มีการลงทะเบียนน้อยกว่า ac_seat หรือ ac_seat เป็น NULL หรือ 0
        .andWhere("activity.ac_end_register > :currentDate", { currentDate }) // กรองกิจกรรมที่ ac_end_register ยังไม่ผ่านวันที่ปัจจุบัน
        .andWhere(
          "(activity.ac_registered_count IS NULL OR activity.ac_registered_count < activity.ac_seat)"
        ) // กรองกิจกรรมที่ ac_registered_count น้อยกว่า ac_seat หรือ ac_seat เป็น NULL
        .getMany();
    } catch (error) {
      logger.error("❌ Error in getAllActivities(Admin):", error);
      throw new Error("Failed to get all activities");
    }
  }

  async fetchEnrolledActivities(u_id: number): Promise<Activity[]> {
    if (!this.activityRepository) {
      throw new Error("Repository is not initialized")
    }
    try {
      const query = "SELECT a.ac_name, a.ac_type, a.ac_description, a.ac_start_time, a.ac_seat, u.u_soft_hours, u.u_hard_hours FROM users u JOIN activity a ON u.u_id = a.ac_id WHERE u_id = $1"
      const result = await this.activityRepository.query(query, [u_id]);
      return result
    } catch (error) {
      console.log(`Error form fetchEnrolledActivities Dao: ${error}`)
      throw new Error("Failed to get fetchEnrolledActivities")
    }
  }
}
