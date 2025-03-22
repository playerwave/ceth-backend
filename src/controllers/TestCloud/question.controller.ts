import { Request, Response } from "express";
import { QuestionService } from "../../services/TestCloud/question.service";

export class QuestionController {
  private questionService = new QuestionService();

  // ฟังก์ชันสำหรับแสดงรายชื่อผู้ใช้
  getQuestion = async (req: Request, res: Response) => {
    try {
      const questions = await this.questionService.getQuestion();
      return res.render("question.ejs", {
        question: questions,
      });
    } catch (error) {
      res.status(500).send("Error to Response");
    }
  };
}
