import { Repository } from "typeorm";
import { connectDatabase } from "../../db/database";
import { Assessment } from "../../entity/Assesment";

export class AssessmentDao {
  private assessmentRepository: Repository<Assessment> | null = null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.assessmentRepository = connection.getRepository(Assessment);
      })
      .catch((error) => {
        console.log(
          "Error in AssessmentDao(Admin) Database connection failed :",
          error
        );
      });
  }

  async getAssessmentById(assessmentId: number): Promise<Assessment | null> {
    if (!this.assessmentRepository) {
      throw new Error("Database connection not established");
    }
    return await this.assessmentRepository.findOne({
      where: { as_id: assessmentId },
    }); // ✅ ใช้ `findOne`
  }
}
