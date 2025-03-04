import { Router, Request, Response } from "express";
import { ActivityController } from "../../controllers/Test/activity.controller";
const router = Router();
const activityController = new ActivityController();

router.get("/acitvities", async (req: Request, res: Response) => {
  await activityController.getAcitvities(req, res);
});

router.get("/searchActivity", async (req: Request, res: Response) => {
  await activityController.searchActivity(req, res)
})




// router.get("/tests", async (req: Request, res: Response) => {
//   await activityController.getTest(req, res);
// })
export default router;
