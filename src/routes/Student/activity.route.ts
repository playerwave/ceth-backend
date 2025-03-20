import { Router } from "express";
import { activityController } from "../../controllers/Student/activity.controller";

const router = Router();

router.get("/get-student-activities/:id", (req, res, next) =>
  activityController.getAllActivitiesController(req, res).catch(next)
);

router.get("/fetchEnrolledActivities/:u_id", (req, res) => {
  activityController.fetchEnrolledActivities(req, res);
});

// ✅ ตรวจสอบว่าเส้นทางนี้มีอยู่
router.get("/skillStats/:id", (req, res) => {
  activityController.getSkillStats(req, res);
});

export default router;
