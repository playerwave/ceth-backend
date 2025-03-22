import { Router, Request, Response } from "express";
import { QuestionController } from "../../controllers/TestCloud/question.controller";

const router = Router();
const questionController = new QuestionController();

router.get("/", async (req: Request, res: Response) => {
  await questionController.getQuestion(req, res);
});

export default router;
