import { AnswerDao } from "../daos/Admin/answer.dao";
import { Answer } from "../interfaces/Answer";

export class AnswerService {
  private answerDao = new AnswerDao();

  async getAllAnswers(): Promise<Answer[]> {
    return this.answerDao.getAllAnswers();
  }

  async getAnswerById(id: number): Promise<Answer | null> {
    return this.answerDao.getAnswerById(id);
  }
}
