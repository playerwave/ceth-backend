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
      throw new Error("Error in createActivityDao(Admin) Database connection is not established");
    }

    const activity = this.activityRepository.create(activityData);
    return await this.activityRepository.save(activity);
  }
}
