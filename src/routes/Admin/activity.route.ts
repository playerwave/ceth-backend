import { Router, Request, Response } from "express";
import { ActivityController } from "../../controllers/Admin/activity.controller";

const activityController = new ActivityController();
const router = Router();

router.get("/get-activities", async (req: Request, res: Response) => {
  await activityController.getAllActivities(req, res);
});

router.get("/get-activity/:id", async (req: Request, res: Response) => {
  await activityController.getActivityById(req, res);
});

router.post("/create-activity", async (req: Request, res: Response) => {
  await activityController.createActivity(req, res);
});

router.put("/update-activity/:id", async (req: Request, res: Response) => {
  await activityController.updateActivity(req, res);
});

router.delete("/delete-activity/:id", async (req: Request, res: Response) => {
  await activityController.deleteActivity(req, res);
});

export default router;
