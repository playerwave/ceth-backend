import { Repository } from "typeorm";
import { connectDatabase } from "../../db/database";
import { Activity } from "../../entity/Activity";

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
      console.error("❌ Error initializing ActivityDao:", error);
    }
  }

  private checkRepository(): void {
    if (!this.activityRepository) {
      throw new Error("Database connection is not established");
    }
  }

  async createActivityDao(activityData: Partial<Activity>): Promise<Activity> {
    this.checkRepository();

    const activity = this.activityRepository!.create(activityData);
    console.log("📌 Creating activity:", activityData);

    return await this.activityRepository!.save(activity);
  }

  async updateActivityDao(
    activityId: number,
    activityData: Partial<Activity>
  ): Promise<Activity> {
    this.checkRepository();

    console.log("🔄 Updating activity with ID:", activityId);
    const existingActivity = await this.activityRepository!.findOne({
      where: { ac_id: activityId },
    });

    if (!existingActivity) {
      throw new Error(`Activity with ID ${activityId} not found`);
    }

    Object.assign(existingActivity, activityData);
    return await this.activityRepository!.save(existingActivity);
  }

  async getActivityByIdDao(activityId: number): Promise<Activity | null> {
    this.checkRepository();

    try {
      return await this.activityRepository!.findOneOrFail({
        where: { ac_id: activityId },
        relations: ["assessment"],
      });
    } catch (error) {
      console.error(`❌ Error fetching activity with ID ${activityId}:`, error);
      return null;
    }
  }

  async deleteActivityDao(activityId: number): Promise<boolean> {
    this.checkRepository();

    console.log("🔄 Attempting to delete activity with ID:", activityId);
    const deleteResult = await this.activityRepository!.delete(activityId);

    if (deleteResult.affected === 0) {
      console.warn(`⚠️ Activity with ID ${activityId} not found.`);
      return false;
    }

    console.log(`✅ Activity with ID ${activityId} deleted successfully.`);
    return true;
  }

  async getAllActivities(
    offset: number,
    limit: number
  ): Promise<[Activity[], number]> {
    this.checkRepository();

    console.log("📌 Fetching all activities with pagination");
    return await this.activityRepository!.findAndCount({
      skip: offset,
      take: limit,
    });
  }

  async searchActivity(ac_name: string): Promise<Activity[]> {
    this.checkRepository();

    try {
      const query =
        "SELECT * FROM activity WHERE ac_name ILIKE '%' || $1 || '%' ORDER BY ac_id ASC";
      return await this.activityRepository!.query(query, [ac_name]);
    } catch (error) {
      console.error(`❌ Error in searchActivity:`, error);
      throw new Error(`Error fetching activities: ${error}`);
    }
  }

  async adjustStatusActivity(
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
}
