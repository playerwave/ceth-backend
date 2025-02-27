import { Router, Request, Response } from "express";
import { ActivityController } from "../../controllers/Test/activity.controller";
const router = Router();
const activityController = new ActivityController();

router.get("/activitys", async (req: Request, res: Response) => {
  await activityController.getAllActivitys(req, res);
});

router.get("/activitys/:id", async (req: Request, res: Response) => {
  await activityController.getActivityById(req, res);
});

router.get("/activities/search", async (req: Request, res: Response) => {
  await activityController.searchActivitiesByName(req, res);
});

export default router;
