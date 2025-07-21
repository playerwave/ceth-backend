import { Router, Request, Response } from "express";
import { ActivityController } from "../../controllers/visitor/activity.controller";

const router = Router();
const activityController = new ActivityController();

router.get("/count", async (req: Request, res: Response) => {
    await activityController.countActivity(req, res)
})

router.get("/", async (req: Request, res: Response) => {
    await activityController.getAllActivityByVisitor(req, res)
})

export default router