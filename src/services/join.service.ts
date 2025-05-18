import { JoinDao } from "../daos/Admin/join.dao";
import { Join } from "../interfaces/Join";

export class JoinService {
  private joinDao = new JoinDao();

  async getAllJoins(): Promise<Join[]> {
    return this.joinDao.getAllJoins();
  }

  async getJoinById(id: number): Promise<Join | null> {
    return this.joinDao.getJoinById(id);
  }
}
