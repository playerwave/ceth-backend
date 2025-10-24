// import { Router } from "express";
// import { activityController } from "../../controllers/Student/activity.controller";

// const router = Router();

// router.get("/get-student-activities/:id", (req, res, next) =>
//   activityController.getStudentActivitiesController(req, res).catch(next)
// );

// router.post("/student-enroll-activity/:id", (req, res, next) =>
//   activityController.studentEnrollActivityController(req, res).catch(next)
// );
// // router.post("/student-enroll-activity/:id", (req, res, next) => {
// //   const userId = parseInt(req.params.id, 10); // แปลงจาก string เป็น number
// //   const activityId = req.body.ac_id; // สมมติว่า ac_id จะถูกส่งมาจาก body
// //   activityController
// //     .studentEnrollActivityController(userId, activityId)
// //     .catch(next);
// // });

// router.get("/searchActivity", (req, res, next) =>
//   activityController.searchActivityController(req, res).catch(next)
// );

// router.get("/get-activity/:id", (req, res, next) =>
//   activityController.getActivityByIdController(req, res).catch(next)
// );

// router.get("/get-enrolled-activities/:id", (req, res) => {
//   activityController.getEnrolledActivitiesController(req, res);
// });

// router.delete("/unenroll-activity/:id", (req, res, next) =>
//   activityController.unEnrollActivityController(req, res).catch(next)
// );

// export default router;

import { Router } from "express";
import { activityController } from "../../controllers/Student/activity.controller";
import { wrapAsync } from "../../utils/wrapAsync";

const router = Router();

// ✅ POST METHOD
router.post(
  "/student-enroll-activity/:activityId/:studentId",
  wrapAsync(activityController.enrollActivity)
);

// ✅ DELETE METHOD
router.delete(
  "/unenroll-activity/:id",
  wrapAsync(activityController.unEnrollActivity)
);

// ✅ POST METHOD สำหรับรีเซ็ต registered_count
router.post(
  "/reset-registered-counts",
  wrapAsync(activityController.resetRegisteredCounts)
);

router.get(
  "/history/:studentId",
  wrapAsync(activityController.getActivityHistoryByStudentsID)
);

router.get(
  "/get-search/:studentId",
  wrapAsync(activityController.getSearch)
);

// ✅ GET METHODS
router.get(
  "/get-student-activities/:id",
  wrapAsync(activityController.getStudentActivities.bind(activityController))
);

router.get(
  "/get-enrolled-activities/:id",
  wrapAsync(activityController.getEnrolledActivities)
);

router.get(
  "/get-ongoing-activities/:id",
  wrapAsync(activityController.getOngoingActivities)
);

router.get("/get-activity/:id", wrapAsync(activityController.getActivityById));

router.get("/assessment/:activityId", wrapAsync(activityController.getAssessmentByActivityId));

// ✅ GET METHOD สำหรับดึง join_id
router.get("/:activityId/join-id/:studentId", wrapAsync(activityController.getJoinIdByStudentAndActivity));

// Debug endpoint
router.get("/debug/:activityId", wrapAsync(activityController.debugActivityData));

// ✅ เมธอดใหม่: เช็คสถานะการทำแบบประเมิน
router.get("/assessment-status/:activityId/:studentId", wrapAsync(activityController.checkAssessmentStatus));

router.get("/searchActivity", wrapAsync(activityController.searchActivity));

// ✅ POST METHOD สำหรับ Check-in/Check-out
router.post(
  "/check-in-out/:activityId",
  wrapAsync(activityController.checkInOutActivity)
);

// ✅ GET METHOD สำหรับดึงกิจกรรม Course ที่พร้อมส่ง Certificate
router.get(
  "/available-course-activities",
  wrapAsync(activityController.getAvailableCourseActivities)
);

export default router;
