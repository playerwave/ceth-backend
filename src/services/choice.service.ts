// src/services/choice.service.ts

import { ChoiceDao } from "../daos/Admin/choice.dao";
import { Choice } from "../interfaces/Choice";

export class ChoiceService {
  private choiceDao = new ChoiceDao();

  // ดึงรายการ choice ทั้งหมด
  async getAllChoices(): Promise<Choice[]> {
    return this.choiceDao.getAllChoices();
  }

  // ดึง choice ตาม ID
  async getChoiceById(id: number): Promise<Choice | null> {
    if (isNaN(id)) {
      throw new Error("Invalid choice ID");
    }
    return this.choiceDao.getChoiceById(id);
  }
}
