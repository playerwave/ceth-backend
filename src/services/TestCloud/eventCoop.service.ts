import { EventCoopDao } from "../../daos/TestCloud/eventcoop.dao";
import { EventCoop } from "../../entity/EventCoop";
export class EventCoopService {
  private eventCoopDao = new EventCoopDao();

  async getEventCoop(): Promise<EventCoop[]> {
    return await this.eventCoopDao.getEventCoop();
  }
}
