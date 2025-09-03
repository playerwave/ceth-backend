import { SetNumber } from "../../entity/setNumbers.entity";
import { ErrorHandledService } from "../error.handdled.service";
import { SetNumberDao } from "../../daos/Teacher/setNumber.dao";
import { QuestionDao } from "../../daos/Teacher/question.dao";

export class SetNumberService extends ErrorHandledService {
  constructor(private readonly setNumberDao = new SetNumberDao(), private readonly questionDao = new QuestionDao()) {
    super();
  }

  public async createSetNumber(name: string, status: string | undefined): Promise<SetNumber> {
    try {
      // ข้อมูลจะถูก validate แล้วโดย DTO และ middleware
      const trimmedName = name.trim();
      const trimmedStatus = status?.trim() || 'Active'; // Default to 'Active' if status is undefined

      // ตรวจสอบว่าชื่อไม่ว่างเปล่า
      if (!trimmedName) {
        throw new Error("ชื่อชุดคำถามไม่สามารถเป็นค่าว่างได้");
      }

      // ตรวจสอบ status ที่อนุญาต
      const allowedStatuses = ["Active", "Inactive"];
      if (!allowedStatuses.includes(trimmedStatus)) {
        throw new Error(`สถานะต้องเป็น 'Active' หรือ 'Inactive' เท่านั้น`);
      }

      const existing = await this.setNumberDao.getSetNumberByName(trimmedName);
      if (existing.length > 0) {
        this.logInfo("🚫 Duplicate set name", { name: trimmedName });
        throw new Error("มีชุดคำถามนี้อยู่ในระบบแล้ว");
      }

      const created = await this.setNumberDao.addSetNumber(trimmedName, trimmedStatus);
      this.logInfo("🆕 SetNumber created", { set_number_id: created.set_number_id });
      return created;
    } catch (error) {
      this.logError("❌ Error in createSetNumber", error);
      throw error;
    }
  }



  public async getSetNumbersQuestionByID(set_number_id: number): Promise<SetNumber[]> {
    try {
      const result = await this.setNumberDao.getSetNumbersQuestionByID(set_number_id)
      this.logInfo("📦 SetNumbers fetched");
      return result;
    } catch (error) {
      this.logError("❌ Error in getSetNumbers", error);
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
    status: string | undefined
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
    const Find_SetNumber = await this.setNumberDao.getSetNumberByID(set_number_id)
    const Question_IN_SetNumber = await this.questionDao.getQuestionBySetNumberID(set_number_id)
    try {

      if (Find_SetNumber.length > 0) {
        const ID = Find_SetNumber[0].set_number_id
        if (Question_IN_SetNumber.length > 0) {
          await this.questionDao.deleteQuestionBySetNumberID(ID)
          const deleted = await this.setNumberDao.deleteSetNumber(ID);
          if (deleted) {
            this.logInfo("🗑️ SetNumber deleted", { ID });
          }
          return deleted;
        } else {
          const deleted = await this.setNumberDao.deleteSetNumber(ID);
          if (deleted) {
            this.logInfo("🗑️ SetNumber deleted", { ID });
          }
          return deleted;
        }
      } else {
        console.log(`ไม่พบชุดแบบสอบถาม ID ${set_number_id} อยู่ในระบบ`)
        return null;
      }

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
