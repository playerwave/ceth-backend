import { connectDatabase } from "../../db/database";
import { Repository } from "typeorm";
import { UserChoice } from "../../entity/UserChoice";

export class UserChoiceDao {
  private userChoiceRepository: Repository<UserChoice> | null = null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.userChoiceRepository = connection.getRepository(UserChoice);
      })
      .catch((error) => {
        console.error("Database connection failed:", error);
      });
  }

  async getUserChoice(): Promise<UserChoice[]> {
    if (!this.userChoiceRepository) {
      throw new Error("Repository is not initialized");
    }

    try {
      const result = await this.userChoiceRepository.find();
      return result;
    } catch (error) {
      throw new Error(`Error from Dao GET User : ${error}`);
    }
  }
}
