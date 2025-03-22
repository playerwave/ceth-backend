import { connectDatabase } from "../../db/database";
import { Repository } from "typeorm";
import { EventCoop } from "../../entity/EventCoop";

export class EventCoopDao {
  private eventCoopRepository: Repository<EventCoop> | null = null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.eventCoopRepository = connection.getRepository(EventCoop);
      })
      .catch((error) => {
        console.error("Database connection failed:", error);
      });
  }

  async getEventCoop(): Promise<EventCoop[]> {
    if (!this.eventCoopRepository) {
      throw new Error("Repository is not initialized");
    }

    try {
      const result = await this.eventCoopRepository.find();
      return result;
    } catch (error) {
      throw new Error(`Error from Dao GET User : ${error}`);
    }
  }
}
