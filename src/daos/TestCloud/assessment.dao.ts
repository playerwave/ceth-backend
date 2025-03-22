import { connectDatabase } from "../../db/database";
import { Repository } from "typeorm";
import { Assessment } from "../../entity/Assessment";

export class AssessmentDao {
  private assessmentRepository: Repository<Assessment> | null = null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.assessmentRepository = connection.getRepository(Assessment);
      })
      .catch((error) => {
        console.error("Database connection failed:", error);
      });
  }

  async getAssessment(): Promise<Assessment[]> {
    if (!this.assessmentRepository) {
      throw new Error("Repository is not initialized");
    }

    try {
      const result = await this.assessmentRepository.find();
      console.log(result)
      return result;
    } catch (error) {
      throw new Error(`Error from Dao GET User : ${error}`);
    }
  }
}
