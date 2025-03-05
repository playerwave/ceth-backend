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
      relations: ["assessment"], // ✅ เปลี่ยนจาก "assessments" เป็น "assessment"
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
}
