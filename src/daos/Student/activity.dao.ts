import { Repository, getRepository } from "typeorm";
import { connectDatabase } from "../../db/database";
import { UserActivity } from "../../entity/UserActivity";
import { Activity } from "../../entity/Activity";
import { User } from "../../entity/User";
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

  async getStudentActivitiesDao(userId: number): Promise<Activity[]> {
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

  async getActivityByIdDao(activityId: number): Promise<Activity | null> {
    this.checkRepository();

    try {
      const activity = await this.activityRepository!.createQueryBuilder(
        "activity"
      )
        .leftJoinAndSelect("activity.assessment", "assessment") // ✅ ดึง assessment ด้วย
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

  async studentEnrollActivityDao(
    userId: number,
    activityId: number
  ): Promise<void> {
    const userActivityRepository = getRepository(UserActivity);
    const userRepository = getRepository(User);
    const activityRepository = getRepository(Activity);

    const user = await userRepository.findOneBy({ u_id: userId });
    const activity = await activityRepository.findOneBy({ ac_id: activityId });

    if (!user || !activity) {
      throw new Error("User or activity not found.");
    }

    // ✅ ตรวจสอบว่า ac_registered_count >= ac_seat หรือไม่
    if (
      activity.ac_seat !== null &&
      activity.ac_seat !== undefined &&
      activity.ac_registered_count !== undefined &&
      activity.ac_seat !== 0 &&
      activity.ac_registered_count >= activity.ac_seat
    ) {
      throw new Error("Activity is full. Cannot register.");
    }

    const existingRegistration = await userActivityRepository.findOne({
      where: { user: user, activity: activity },
    });

    if (existingRegistration) {
      throw new Error("User has already registered for this activity.");
    }

    // ✅ ใช้ instance แทน `create()`
    const userActivity = new UserActivity();
    userActivity.user = user;
    userActivity.activity = activity;
    userActivity.uac_checkin = undefined;
    userActivity.uac_checkout = undefined;
    userActivity.uac_take_assessment = false;

    await userActivityRepository.save(userActivity);

    await activityRepository.update(activity.ac_id, {
      ac_registered_count: () => "ac_registered_count + 1",
    });
  }
}
