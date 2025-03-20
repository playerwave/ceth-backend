import { Router } from "express";
import { activityController } from "../../controllers/Student/activity.controller";

const router = Router();

router.get("/get-student-activities/:id", (req, res, next) =>
  activityController.getStudentActivitiesController(req, res).catch(next)
);

router.post("/student-enroll-activity/:id", (req, res, next) =>
  activityController.studentEnrollActivityController(req, res).catch(next)
);

router.get("/get-activity/:id", (req, res, next) =>
  activityController.getActivityByIdController(req, res).catch(next)
);

router.delete("/unenroll-activity/:id", (req, res, next) =>
  activityController.unEnrollActivityController(req, res).catch(next)
);

router.get("/get-enrolled-activities/:id", (req, res) => {
  activityController.getEnrolledActivitiesController(req, res);
});

export default router;
