import { EventCoopDao } from "../daos/Admin/eventcoop.dao";
import { EventCoop } from "../interfaces/EventCoop";

export class EventCoopService {
  private eventCoopDao = new EventCoopDao();

  async getAllEventCoops(): Promise<EventCoop[]> {
    return this.eventCoopDao.getAllEventCoops();
  }

  async getEventCoopById(id: number): Promise<EventCoop | null> {
    return this.eventCoopDao.getEventCoopById(id);
  }
}
