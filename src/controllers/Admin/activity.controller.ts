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
        "Received request body in createActivityController :",
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
        ac_image_url,
        ac_normal_register,
        assessment_id,
      } = req.body;

      console.log("Extracted assessment_id:", assessment_id);
      if (
        !ac_name ||
        !ac_company_lecturer ||
        !ac_type ||
        !ac_seat ||
        !ac_status ||
        !ac_start_register ||
        !ac_end_register ||
        !ac_registered_count ||
        !ac_attended_count ||
        !ac_not_attended_count ||
        !ac_start_time ||
        !ac_end_time ||
        !ac_image_url ||
        !ac_normal_register ||
        !ac_location_type ||
        !assessment_id
      ) {
        return res.status(400).json({
          message: "Invalid input data in (Admin) createActivity controller",
        });
      }

      const activity = await this.activityService.createActivityService({
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
        ac_image_url,
        ac_normal_register,
        assessment_id,
      });

      return res.status(201).json(activity);
    } catch (error) {
      return res.status(500).json({
        message: "Error in (Admin) activity controller createActivity: ",
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

      // ✅ ดึง activityId จาก URL params และตรวจสอบว่าเป็นตัวเลข
      const activityId = parseInt(req.params.id, 10);
      if (!activityId) {
        return res
          .status(400)
          .json({ message: "Invalid activityId in request params" });
      }

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
        ac_image_url,
        ac_normal_register,
        assessment_id,
      } = req.body;

      const activity = await this.activityService.updateActivityService(
        activityId,
        {
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
          ac_image_url,
          ac_normal_register,
          assessment_id,
        }
      );

      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      return res.status(200).json(activity);
    } catch (error) {
      return res.status(500).json({
        message: "Error in (Admin) activity controller updateActivity",
        error: (error as Error).message,
      });
    }
  };
}
