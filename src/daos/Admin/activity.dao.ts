import { Repository } from "typeorm";
import { connectDatabase } from "../../db/database";
import { Activity } from "../../entity/Activity";

export class ActivityDao {
  private activityRepository: Repository<Activity> | null = null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.activityRepository = connection.getRepository(Activity);
      })
      .catch((error) => {
        console.log(
          "Error in ActivityDao(Admin) Database connection to Entity failed :",
          error
        );
      });
  }

  async createActivityDao(activityData: Partial<Activity>): Promise<Activity> {
    if (!this.activityRepository) {
      throw new Error(
        "Error in createActivityDao(Admin) Database connection is not established"
      );
    }

    const activity = this.activityRepository.create(activityData);
    return await this.activityRepository.save(activity);
  }

  async updateActivityDao(
    activityId: number,
    activityData: Partial<Activity>
  ): Promise<Activity> {
    if (!this.activityRepository) {
      throw new Error("Database connection is not established");
    }

    console.log("🔄 Updating activity with ID:", activityId);
    const existingActivity = await this.activityRepository.findOne({
      where: { ac_id: activityId },
    });

    if (!existingActivity) {
      throw new Error(`Activity with ID ${activityId} not found`);
    }

    if (activityData.ac_image_data) {
      console.log("📸 Updating image in database...");
    }

    Object.assign(existingActivity, activityData);
    return await this.activityRepository.save(existingActivity);
  }

  async getActivityByIdDao(activityId: number): Promise<Activity | null> {
    if (!this.activityRepository) {
      throw new Error(
        "Error in getActivityByIdDao(Admin) Database connection is not established"
      );
    }

    return await this.activityRepository.findOne({
      where: { ac_id: activityId },
      relations: ["assessment"], // ✅ ตรวจสอบ relations ให้ถูกต้อง
      select: [
        "ac_id",
        "ac_name",
        "ac_description",
        "ac_image_data", // ✅ ต้องแน่ใจว่าเราดึงค่า image
        "ac_start_time",
        "ac_end_time",
      ],
    });
  }

  async deleteActivityDao(activityId: number): Promise<void> {
    if (!this.activityRepository) {
      throw new Error("Database connection is not established");
    }

    console.log("🔄 Attempting to delete activity with ID:", activityId);
    const deleteResult = await this.activityRepository.delete(activityId);

    if (deleteResult.affected === 0) {
      console.error(
        `❌ Activity with ID ${activityId} not found or could not be deleted.`
      );
      throw new Error(
        `Activity with ID ${activityId} not found or could not be deleted.`
      );
    }

    console.log(`✅ Activity with ID ${activityId} deleted successfully.`);
  }

  async getAllActivities(): Promise<Activity[]> {
    if (!this.activityRepository) {
      throw new Error(
        "Error in getAllActivities Database connection is not established"
      );
    }

    console.log("📌 Fetching all activities");
    return await this.activityRepository.find();
  }

  async getActivityById(id: number): Promise<Activity | null> {
    if (!this.activityRepository) {
      throw new Error(
        "Error in getActivityById Database connection is not established"
      );
    }

    console.log("🔍 Fetching activity with ID:", id);
    return await this.activityRepository.findOne({
      where: { ac_id: id },
      relations: ["assessment"],
    });
  }

  async searchActivity(ac_name: string): Promise<Activity[]> {
    if (!this.activityRepository) {
      throw new Error("Repository is not initialized");
    }
    try {
      const query =
        "SELECT * FROM activity WHERE ac_name ILIKE '%' || $1 || '%' ORDER BY ac_id ASC";
      const result = await this.activityRepository.query(query, [ac_name]);
      return result;
    } catch (error) {
      console.log(`Error From activity dao: ${error}`);
      throw new Error(`Error fetching all activities: ${error}`);
    }
  }

  async adjustStatusActivity(
    ac_id: number,
    ac_status: string
  ): Promise<Activity | null> {
    if (!this.activityRepository) {
      throw new Error("Repository is not initialized");
    }

    const status = ac_status.trim().toLowerCase();
    if (status !== "public" && status !== "private") {
      throw new Error(
        "ค่าที่ส่งเข้ามาที่ ac_status ไม่ใช่ 'Public' หรือ 'Private'"
      );
    }

    try {
      const query = `UPDATE activity SET ac_status = $1, ac_last_update = NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok' WHERE ac_id = $2`;
      await this.activityRepository.query(query, [ac_status, ac_id]);
      const querySelect = "SELECT * FROM activity WHERE ac_id = $1";
      const result = await this.activityRepository.query(querySelect, [ac_id]);
      return result;
    } catch (error) {
      console.log(`Error From activity dao: ${error}`);
      throw new Error(`Error fetching all activities: ${error}`);
    }
  }
}
