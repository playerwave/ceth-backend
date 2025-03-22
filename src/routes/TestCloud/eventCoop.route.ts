import { Router, Request, Response } from "express";
import { EventCoopController } from "../../controllers/TestCloud/eventCoop.controller";

const router = Router();
const eventCoopController = new EventCoopController();

router.get("/", async (req: Request, res: Response) => {
  await eventCoopController.getEventCoop(req, res);
});

export default router;
