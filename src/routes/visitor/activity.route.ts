import { Router, Request, Response } from "express";
import { ActivityController } from "../../controllers/visitor/activity.controller";

const router = Router();
const activityController = new ActivityController();

router.get("/count", async (req: Request, res: Response) => {
  await activityController.countActivity(req, res);
});

router.get("/get-visitor-activities", async (req: Request, res: Response) => {
  await activityController.getAllActivityByVisitor(req, res);
});

export default router;
