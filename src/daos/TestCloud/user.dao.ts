import { Users } from "../../entity/Users";
import { connectDatabase } from "../../db/database";
import { Repository } from "typeorm";

export class UserDao {
  private userRepository: Repository<Users> | null = null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.userRepository = connection.getRepository(Users);
      })
      .catch((error) => {
        console.error("Database connection failed:", error);
      });
  }

  async getUsers(): Promise<Users[]> {
    if (!this.userRepository) {
      throw new Error("Repository is not initialized");
    }

    try {
      const result = await this.userRepository.find({
        relations: ["eventCoop"],
      });
      //   console.log(result)
      return result;
    } catch (error) {
      throw new Error(`Error from Dao GET User : ${error}`);
    }
  }
}
