import { connectDatabase } from "../../db/database";
import { Repository } from "typeorm";
import { Question } from "../../entity/Question";

export class QuestionDao {
  private questionRepository: Repository<Question> | null = null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.questionRepository = connection.getRepository(Question);
      })
      .catch((error) => {
        console.error("Database connection failed:", error);
      });
  }

  async getQuestion(): Promise<Question[]> {
    if (!this.questionRepository) {
      throw new Error("Repository is not initialized");
    }

    try {
      const result = await this.questionRepository.find();
      return result;
    } catch (error) {
      throw new Error(`Error from Dao GET User : ${error}`);
    }
  }
}
