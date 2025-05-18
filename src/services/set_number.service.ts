import { SetNumberDao } from "../daos/Admin/set_number.dao";
import { SetNumber } from "../interfaces/SetNumber";

export class SetNumberService {
  private setNumberDao = new SetNumberDao();

  async getAllSetNumbers(): Promise<SetNumber[]> {
    return this.setNumberDao.getAllSetNumbers();
  }

  async getSetNumberById(id: number): Promise<SetNumber | null> {
    return this.setNumberDao.getSetNumberById(id);
  }
}
