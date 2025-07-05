import redis from "../../config/redis";
import { EventCoopDao } from "../../daos/Student/eventcoop.dao";
import { EventCoop } from "../../entity/eventcoop.entity";
import { ErrorHandledService } from "../error.handdled.service";

export class EventCoopService extends ErrorHandledService {
  constructor(private readonly eventCoopDao = new EventCoopDao()) {
    super();
  }

  public async countEventCoop(): Promise<number> {
    try {
      const count = await this.eventCoopDao.countEventCoop();
      this.logInfo("📊 EventCoop count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countEventCoop", error);
      throw error;
    }
  }

  public async getEventCoop(): Promise<EventCoop[]> {
    const cacheKey = `eventCoop:all`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.logInfo("📦 Returning cached eventCoop data");
        return JSON.parse(cached);
      }

      const data = await this.eventCoopDao.getEventCoop();
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 EventCoop data retrieved and cached", {
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logError("❌ Error in getEventCoop", error);
      throw error;
    }
  }
}
