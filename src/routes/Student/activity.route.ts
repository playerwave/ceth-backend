import { Router } from "express";
import { activityController } from "../../controllers/Student/activity.controller";

const router = Router();

router.get("/get-student-activities/:id", (req, res, next) =>
  activityController.getStudentActivitiesController(req, res).catch(next)
);

router.post("/student-enroll-activity/:id", (req, res, next) =>
  activityController.studentEnrollActivityController(req, res).catch(next)
);
// router.post("/student-enroll-activity/:id", (req, res, next) => {
//   const userId = parseInt(req.params.id, 10); // แปลงจาก string เป็น number
//   const activityId = req.body.ac_id; // สมมติว่า ac_id จะถูกส่งมาจาก body
//   activityController
//     .studentEnrollActivityController(userId, activityId)
//     .catch(next);
// });

export default router;
