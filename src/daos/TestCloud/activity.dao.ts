import { connectDatabase } from "../../db/database";
import { Repository } from "typeorm";
import { Activity } from "../../entity/Activity";

export class ActivityDao {
  private activityRepository: Repository<Activity> | null = null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.activityRepository = connection.getRepository(Activity);
      })
      .catch((error) => {
        console.error("Database connection failed:", error);
      });
  }

  async getActivity(): Promise<Activity[]> {
    if (!this.activityRepository) {
      throw new Error("Repository is not initialized");
    }

    try {
      const result = await this.activityRepository.find();
      return result;
    } catch (error) {
      throw new Error(`Error from Dao GET User : ${error}`);
    }
  }
}
