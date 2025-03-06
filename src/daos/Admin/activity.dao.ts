import { connectDatabase } from "../../db/database";
import { Activity } from "../../entity/Activity";
import { Repository } from "typeorm";

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
}
