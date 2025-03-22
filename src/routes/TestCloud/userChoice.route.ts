import { Router, Request, Response } from "express";
import { UserChoiceController } from "../../controllers/TestCloud/userChoice.controller";

const router = Router();
const userChoiceController = new UserChoiceController();

router.get("/", async (req: Request, res: Response) => {
  await userChoiceController.getUserChoice(req, res);
});

export default router;
