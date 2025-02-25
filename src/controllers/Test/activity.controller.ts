import { Request, Response, RequestHandler } from "express";
import { ActivityService } from "../../services/Test/ActivityService";

export const getAllActivities: RequestHandler = (req, res) => {
  const activities = ActivityService.getAllActivities();
  res.json({ activities });
};

export const getActivityById: RequestHandler = (req, res) => {
  const { id } = req.params;
  const activity = ActivityService.getActivityById(Number(id));

  if (!activity) {
    res.status(404).json({ message: "Activity not found" });
    return;
  }

  res.json({ activity });
};

export const createActivity: RequestHandler = (req, res) => {
  const newActivity = req.body;
  const activity = ActivityService.createActivity(newActivity);
  res.status(201).json({ message: "Activity created successfully", activity });
};

export const updateActivity: RequestHandler = (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const updatedActivity = ActivityService.updateActivity(Number(id), updatedData);

  if (!updatedActivity) {
    res.status(404).json({ message: "Activity not found" });
    return;
  }

  res.json({ message: "Activity updated successfully", updatedActivity });
};

export const deleteActivity: RequestHandler = (req, res) => {
  const { id } = req.params;
  const success = ActivityService.deleteActivity(Number(id));

  if (!success) {
    res.status(404).json({ message: "Activity not found" });
    return;
  }

  res.json({ message: "Activity deleted successfully" });
};
