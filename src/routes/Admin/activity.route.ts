import { Router, Request, Response } from "express";
import { ActivityController } from "../../controllers/Admin/activity.controller";

const activityController = new ActivityController();
const router = Router();

router.post("/create-activity", async (req: Request, res: Response) => {
  await activityController.createActivityController(req, res);
});

// router.get("/activities", async (req: Request, res: Response) => {
//   await activityController.getAllActivities(req, res);
// });

// router.delete("/delete-activity/:id", async (req: Request, res: Response) => {
//   await activityController.deleteActivity(req, res);
// });

export default router;
