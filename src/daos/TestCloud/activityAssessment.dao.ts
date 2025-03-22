import { connectDatabase } from "../../db/database";
import { Repository } from "typeorm";
import { ActivityAssessment } from "../../entity/ActivityAssessment";

export class ActivityAssessmentDao {
  private activityAssessmentRepository: Repository<ActivityAssessment> | null =
    null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.activityAssessmentRepository =
          connection.getRepository(ActivityAssessment);
      })
      .catch((error) => {
        console.error("Database connection failed:", error);
      });
  }

  async getActivityAssessment(): Promise<ActivityAssessment[]> {
    if (!this.activityAssessmentRepository) {
      throw new Error("Repository is not initialized");
    }

    try {
      const result = await this.activityAssessmentRepository.find();
      return result;
    } catch (error) {
      throw new Error(`Error from Dao GET User : ${error}`);
    }
  }
}
