import { Activity } from "../../entity/Activity";
import { connectDatabase } from "../../db/database";
import { Repository } from "typeorm";
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

  async getAcitvities(): Promise<Activity[]> {
    if (!this.activityRepository) {
      throw new Error("Repository is not initialized");
    }
    try {
      const activity = await this.activityRepository.find();
      return activity;
    } catch (error) {
      throw new Error(`Error fetching all activities: ${error}`);
    }
  }

  async searchActivity(ac_name: string): Promise<Activity[]> {
    if (!this.activityRepository) {
      throw new Error("Repository is not initialized")
    }
    try {
      const query = "SELECT * FROM activity WHERE ac_name ILIKE '%' || $1 || '%' ORDER BY ac_id ASC"
      const result = await this.activityRepository.query(query, [ac_name]);
      return result
    } catch (error) {
      throw new Error(`Error fetching all activities: ${error}`)
    }
  }


  // async getTest(): Promise<Activity[]> {
  //   if (!this.activityRepository) {
  //     throw new Error("Repository is not initialized")
  //   }
  //   try {
  //     const getTests = await this.activityRepository.query("SELECT * FROM activity");
  //     return getTests;
  //   } catch (error) {
  //     throw new Error(`Error fetching all activities: ${error}`)
  //   }
  // }
}
