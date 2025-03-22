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
        .leftJoin("activity.userActivities", "useractivity")
        .where("activity.ac_status = 'Public'") // กรองกิจกรรมที่มีสถานะเป็น Public
        .andWhere(
          "(useractivity.u_id IS NULL OR useractivity.u_id != :userId)",
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

  async fetchEnrolledActivities(u_id: number): Promise<any[]> {  // ✅ เปลี่ยนเป็น any[] เพื่อให้รองรับ soft_hours, hard_hours
    if (!this.activityRepository) {
      throw new Error("Repository is not initialized");
    }
    try {
      const query = `
      SELECT 
        a.ac_id, a.ac_name, a.ac_type, a.ac_description, 
        a.ac_start_time, a.ac_end_time, a.ac_seat, 
        u.u_soft_hours, u.u_hard_hours
      FROM users u
      JOIN useractivity ua ON u.u_id = ua.u_id
      JOIN activity a ON ua.ac_id = a.ac_id
      WHERE u.u_id = $1
      ORDER BY a.ac_start_time ASC;
    `;


      const result = await this.activityRepository.query(query, [u_id]);


      return result;
    } catch (error) {
      console.error(`❌ Error in fetchEnrolledActivities Dao: ${error}`);
      throw new Error("Failed to fetch enrolled activities");
    }




  }

  async getUserSkills(userId: number): Promise<{ u_soft_hours: number; u_hard_hours: number } | null> {
    if (!this.activityRepository) {
      throw new Error("Repository is not initialized");
    }
    try {
      console.log(`📡 Querying database for user ID: ${userId}`); // ✅ Debug

      const query = `
          SELECT u.u_soft_hours, u.u_hard_hours 
          FROM users u
          WHERE u.u_id = $1;
      `;

      const result = await this.activityRepository.query(query, [userId]);

      if (result.length > 0) {
        console.log("✅ Query Result:", result[0]); // ✅ Debug
        return result[0];
      } else {
        console.log("⚠️ No data found for user");
        return null;
      }
    } catch (error) {
      console.error(`❌ Error in getUserSkills DAO: ${error}`);
      throw new Error("Failed to get user skills");
    }
  }






}
