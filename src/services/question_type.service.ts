import { QuestionTypeDao } from "../daos/Admin/question_type.dao";
import { QuestionType } from "../interfaces/QuestionType";

export class QuestionTypeService {
  private questionTypeDao = new QuestionTypeDao();

  async getAllQuestionTypes(): Promise<QuestionType[]> {
    return this.questionTypeDao.getAllQuestionTypes();
  }

  async getQuestionTypeById(id: number): Promise<QuestionType | null> {
    return this.questionTypeDao.getQuestionTypeById(id);
  }
}
