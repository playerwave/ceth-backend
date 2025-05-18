import { RoomDao } from "../daos/Admin/room.dao";
import { Room } from "../interfaces/Room";

export class RoomService {
  private roomDao = new RoomDao();

  async getAllRooms(): Promise<Room[]> {
    return this.roomDao.getAllRooms();
  }

  async getRoomById(id: number): Promise<Room | null> {
    return this.roomDao.getRoomById(id);
  }
}
