import { QuestionDao } from "../../daos/TestCloud/question.dao";
import { Question } from "../../entity/Question";
export class QuestionService {
  private questionDao = new QuestionDao();

  async getQuestion(): Promise<Question[]> {
    return await this.questionDao.getQuestion();
  }
}
