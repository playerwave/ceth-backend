import { Request, Response } from "express";
import { ActivityService } from "../../services/Admin/activity.service";

export class ActivityController {
  private activityService = new ActivityService();

  createActivityController = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      console.log(
        "✅ Received request body in createActivityController:",
        req.body
      );

      const {
        ac_name,
        ac_company_lecturer,
        ac_description,
        ac_type,
        ac_room,
        ac_seat,
        ac_food,
        ac_status,
        ac_location_type,
        ac_start_register,
        ac_end_register,
        ac_registered_count,
        ac_attended_count,
        ac_not_attended_count,
        ac_start_time,
        ac_end_time,
        ac_image_data,
        ac_normal_register,
        assessment_id,
        ac_state,
      } = req.body;

      console.log("🔎 Debugging request data:");
      console.log({
        ac_name,
        ac_company_lecturer,
        ac_type,
        ac_seat,
        ac_status,
        ac_start_register,
        ac_end_register,
        ac_registered_count,
        ac_attended_count,
        ac_not_attended_count,
        ac_start_time,
        ac_end_time,
        ac_image_data: ac_image_data ? "✅ มีรูปภาพ" : "❌ ไม่มีรูปภาพ",
        ac_normal_register,
        ac_location_type,
        assessment_id,
      });

      if (
        !ac_name ||
        !ac_company_lecturer ||
        !ac_type ||
        ac_seat == null ||
        !ac_status ||
        !ac_end_register ||
        ac_registered_count == null ||
        ac_attended_count == null ||
        ac_not_attended_count == null ||
        !ac_start_time ||
        !ac_end_time ||
        !ac_image_data ||
        !ac_normal_register ||
        !ac_location_type ||
        assessment_id == null
      ) {
        console.error("❌ Some required fields are missing or invalid.");
        return res.status(400).json({
          message: "Invalid input data in (Admin) createActivity controller",
        });
      }

      const imageBuffer = ac_image_data
        ? Buffer.from(ac_image_data, "base64")
        : undefined;

      const activityState = ac_state || "Not Start";

      const activity = await this.activityService.createActivityService({
        ac_name,
        ac_company_lecturer,
        ac_description,
        ac_type,
        ac_room,
        ac_seat,
        ac_food: ac_food ? JSON.stringify(ac_food) : "[]",
        ac_status,
        ac_location_type,
        ac_start_register: ac_start_register
          ? new Date(ac_start_register)
          : undefined, // ✅ เปลี่ยนจาก null เป็น undefined
        ac_end_register: new Date(ac_end_register),
        ac_registered_count,
        ac_attended_count,
        ac_not_attended_count,
        ac_start_time: new Date(ac_start_time),
        ac_end_time: new Date(ac_end_time),
        ac_image_data: imageBuffer,
        ac_normal_register: new Date(ac_normal_register),
        ac_state: activityState,
        assessment_id,
      });

      return res.status(201).json(activity);
    } catch (error) {
      console.error("❌ Error in createActivityController:", error);
      return res.status(500).json({
        message: "Error in (Admin) activity controller createActivity",
        error: (error as Error).message,
      });
    }
  };

  updateActivityController = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      console.log(
        "Received request body in updateActivityController:",
        req.body
      );

      const activityId = parseInt(req.params.id, 10);
      if (isNaN(activityId)) {
        return res
          .status(400)
          .json({ message: "Invalid activityId in request params" });
      }

      const updatedActivity = await this.activityService.updateActivityService(
        activityId,
        req.body
      );

      if (!updatedActivity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      return res.status(200).json(updatedActivity);
    } catch (error) {
      return res.status(500).json({
        message: "Error in (Admin) activity controller updateActivity",
        error: (error as Error).message,
      });
    }
  };

  searchActivity = async (req: Request, res: Response) => {
    const { ac_name } = req.body; // ✅ อ่านจาก Body แทน Query

    console.log(req.body.ac_name);

    if (!ac_name) {
      return res.status(400).send("You sent an invalid request.");
    }

    try {
      const activityName = await this.activityService.searchActivity(
        String(ac_name)
      );
      if (activityName.length > 0) {
        return res.status(200).json(activityName);
      } else {
        return res.status(404).send("No activities found.");
      }
    } catch (error) {
      console.log(`Error From activity Service: ${error}`);
      res.status(500).send(`Error: ${error}`);
    }
  };

  adjustStatusActivity = async (req: Request, res: Response) => {
    const { ac_status } = req.body;
    const { id } = req.params;

    if (!ac_status || !id || id == null || id == undefined) {
      return res.status(400).send("You sent an invalid request.");
    }
    try {
      const statusActivity = await this.activityService.adjustStatusActivity(
        Number(id),
        String(ac_status)
      );
      return res.status(200).json(statusActivity);
    } catch (error) {
      console.log(`Error From activity Service: ${error}`);
      res.status(500).send(`Error: ${error}`);
    }
  };

  deleteActivityController = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        console.error("❌ Invalid activity ID:", req.params.id);
        return res.status(400).json({ message: "Invalid activity ID" });
      }

      console.log("✅ Deleting activity with ID:", id);
      await this.activityService.deleteActivityService(id);

      return res.status(204).send();
    } catch (error) {
      console.error("❌ Error deleting activity:", error);

      if ((error as Error).message.includes("not found")) {
        return res.status(404).json({ message: "Activity not found" });
      }

      return res.status(500).json({ message: "Internal server error" });
    }
  };

  getAllActivitiesController = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const activities = await this.activityService.getAllActivitiesService();
      return res.status(200).json(activities);
    } catch (error) {
      console.error("❌ Error in getAllActivities:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  };

  getActivityByIdController = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }
      const activity = await this.activityService.getActivityByIdService(id);
      return activity
        ? res.status(200).json(activity)
        : res.status(404).json({ message: "Activity not found" });
    } catch (error) {
      console.error("❌ Error in getActivityById:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  };
}
