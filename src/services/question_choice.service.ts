import { QuestionChoiceDao } from "../daos/Admin/question_choice.dao";
import { QuestionChoice } from "../interfaces/QuestionChoice";

export class QuestionChoiceService {
  private questionChoiceDao = new QuestionChoiceDao();

  async getAllQuestionChoices(): Promise<QuestionChoice[]> {
    return this.questionChoiceDao.getAllQuestionChoices();
  }

  async getQuestionChoiceById(id: number): Promise<QuestionChoice | null> {
    return this.questionChoiceDao.getQuestionChoiceById(id);
  }
}
