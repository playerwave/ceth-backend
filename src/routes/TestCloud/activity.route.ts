import { Router, Request, Response } from "express";
import { ActivityController } from "../../controllers/TestCloud/activity.controller";

const router = Router();
const activityController = new ActivityController();

router.get("/", async (req: Request, res: Response) => {
  await activityController.getActivity(req, res);
});

export default router;
