import express from "express";
import {
  getAllActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../../controllers/Test/activity.controller";

const router = express.Router();

router.get("/get-activities", getAllActivities);
router.get("/get-activity/:id", getActivityById);
router.post("/create-activity", createActivity);
router.put("/update-activity/:id", updateActivity);
router.delete("/delete-activity/:id", deleteActivity);

export default router;
