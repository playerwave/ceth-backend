import { Router, Request, Response } from "express";
import { ActivityController } from "../../controllers/Test/activity.controller";
const router = Router();
const activityController = new ActivityController();


router.get("/activities", async (req: Request, res: Response) => {
    await activityController.getActivities(req, res)
})

router.get("/searchActivity", async (req: Request, res: Response) => {
    await activityController.searchActivity(req, res);
})

export default router
