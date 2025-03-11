import { Router } from "express";
import { activityController } from "../../controllers/Admin/activity.controller";
import { validateDTO } from "../../middleware/validateDTO";
import {
  CreateActivityDto,
  UpdateActivityDto,
} from "../../dtos/Admin/activity.dto";

const router = Router();

router.post(
  "/create-activity",
  validateDTO(CreateActivityDto),
  (req, res, next) =>
    activityController.createActivityController(req, res).catch(next)
);

router.put(
  "/update-activity/:id",
  validateDTO(UpdateActivityDto),
  (req, res, next) =>
    activityController.updateActivityController(req, res).catch(next)
);

router.delete("/delete-activity/:id", (req, res, next) =>
  activityController.deleteActivityController(req, res).catch(next)
);

router.get("/get-activities", (req, res, next) =>
  activityController.getAllActivitiesController(req, res).catch(next)
);

router.get("/get-activity/:id", (req, res, next) =>
  activityController.getActivityByIdController(req, res).catch(next)
);

router.get("/searchActivity", (req, res, next) =>
  activityController.searchActivityController(req, res).catch(next)
);

export default router;
