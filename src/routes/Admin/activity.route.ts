import express from "express";
import {
  getAllActivities,
  getActivityById,
  getActivityByName,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../../controllers/Admin/activity.controller";

const router = express.Router();

router.get("/get-activities", getAllActivities);
router.get("/get-activity/:id", getActivityById);
router.get("/get-enrolled/:id", getActivityByName);
router.post("/create-activity", createActivity);
router.put("/update-activity/:id", updateActivity);
router.delete("/delete-activity/:id", deleteActivity);

export default router;