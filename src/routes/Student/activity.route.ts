import { Router, Request, Response } from 'express';
import { activityController } from '../../controllers/Student/activity.controller';

const router = Router();

router.get('/get-student-activities/:id', (req, res, next) =>
  activityController.getAllActivitiesController(req, res).catch(next),
);

router.get('/adviceActivities/:u_id', (req, res) => {
  activityController.adviceActivities(req, res);
});

router.get('/calculateRiskActivities/:u_id', (req, res) => {
  activityController.calculateRiskActivities(req, res);
});

export default router;
