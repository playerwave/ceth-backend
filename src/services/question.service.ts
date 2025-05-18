import { QuestionDao } from "../daos/Admin/question.dao";
import { Question } from "../interfaces/Question";

export class QuestionService {
  private questionDao = new QuestionDao();

  async getAllQuestions(): Promise<Question[]> {
    return this.questionDao.getAllQuestions();
  }

  async getQuestionById(id: number): Promise<Question | null> {
    return this.questionDao.getQuestionById(id);
  }
}
