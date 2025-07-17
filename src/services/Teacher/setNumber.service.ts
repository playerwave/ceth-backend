import { SetNumber } from "../../entity/setNumbers.entity";
import { ErrorHandledService } from "../error.handdled.service";
import { SetNumberDao } from "../../daos/Teacher/setNumber.dao";

export class SetNumberService extends ErrorHandledService {
  constructor(private readonly setNumberDao = new SetNumberDao()) {
    super();
  }

  public async createSetNumber(name: string, status: string): Promise<SetNumber> {
    try {
      const existing = await this.setNumberDao.getSetNumberByName(name);
      if (existing.length > 0) {
        this.logInfo("🚫 Duplicate set name", { name });
        throw new Error("มีชุดคำถามนี้อยู่ในระบบแล้ว");
      }

      const created = await this.setNumberDao.addSetNumber(name, status);
      this.logInfo("🆕 SetNumber created", { set_number_id: created.set_number_id });
      return created;
    } catch (error) {
      this.logError("❌ Error in createSetNumber", error);
      throw error;
    }
  }

  public async getSetNumbers(page: number, limit: number): Promise<SetNumber[]> {
    try {
      const result = await this.setNumberDao.getSetNumbers(page, limit);
      this.logInfo("📦 SetNumbers fetched", { count: result.length });
      return result;
    } catch (error) {
      this.logError("❌ Error in getSetNumbers", error);
      throw error;
    }
  }

  public async getSetNumberByID(set_number_id: number): Promise<SetNumber | null> {
    try {
      const result = await this.setNumberDao.getSetNumberByID(set_number_id);
      return result[0] || null;
    } catch (error) {
      this.logError("❌ Error in getSetNumberByID", error);
      throw error;
    }
  }

  public async updateSetNumber(
    set_number_id: number,
    name: string,
    status: string
  ): Promise<SetNumber | null> {
    try {
      const updated = await this.setNumberDao.updateSetNumber(set_number_id, name, status);
      if (updated) {
        this.logInfo("✏️ SetNumber updated", { set_number_id });
      }
      return updated;
    } catch (error) {
      this.logError("❌ Error in updateSetNumber", error);
      throw error;
    }
  }

  public async deleteSetNumber(set_number_id: number): Promise<SetNumber | null> {
    try {
      const deleted = await this.setNumberDao.deleteSetNumber(set_number_id);
      if (deleted) {
        this.logInfo("🗑️ SetNumber deleted", { set_number_id });
      }
      return deleted;
    } catch (error) {
      this.logError("❌ Error in deleteSetNumber", error);
      throw error;
    }
  }

  public async countSetNumbers(): Promise<number> {
    try {
      const count = await this.setNumberDao.countSetNumbers();
      this.logInfo("📊 SetNumber count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countSetNumbers", error);
      throw error;
    }
  }
}
