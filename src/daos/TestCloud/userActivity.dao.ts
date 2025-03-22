import { connectDatabase } from "../../db/database";
import { Repository } from "typeorm";
import { UserActivity } from "../../entity/UserActivity";

export class UserActivityDao {
  private userActivityRepository: Repository<UserActivity> | null = null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.userActivityRepository = connection.getRepository(UserActivity);
      })
      .catch((error) => {
        console.error("Database connection failed:", error);
      });
  }

  async getUserActivity(): Promise<UserActivity[]> {
    if (!this.userActivityRepository) {
      throw new Error("Repository is not initialized");
    }

    try {
      const result = await this.userActivityRepository.find();
      return result;
    } catch (error) {
      throw new Error(`Error from Dao GET User : ${error}`);
    }
  }
}
