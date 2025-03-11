import { Request, Response } from "express";
import { ActivityService } from "../../services/Admin/activity.service";
import { Buffer } from "buffer";
import fs from "fs";
import path from "path";
import { Activity } from "../../entity/Activity";

export class ActivityController {
  private activityService = new ActivityService();

  createActivityController = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      console.log(
        "📩 Received request body in createActivityController:",
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

      console.log("🔎 Debugging request data in createActivityController:");
      console.log({
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
        ac_image_data: ac_image_data ? "✅ มีรูปภาพ" : "❌ ไม่มีรูปภาพ",
        ac_normal_register,
        assessment_id,
        ac_state,
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
        "📩 Received request body in updateActivityController:",
        req.body
      );

      const activityId = parseInt(req.params.id, 10);
      if (isNaN(activityId)) {
        return res
          .status(400)
          .json({ message: "❌ Invalid activityId in request params" });
      }

      let imageBuffer = null;
      if (
        req.body.ac_image_data &&
        req.body.ac_image_data.startsWith("data:image")
      ) {
        console.log("📸 Processing Base64 image...");

        // แปลง Base64 เป็น Buffer
        const base64Data = req.body.ac_image_data.split(",")[1];
        imageBuffer = Buffer.from(base64Data, "base64");
      }

      // ✅ รวมข้อมูลที่ต้องอัปเดต
      const updateData: Partial<Activity> = {
        ac_name: req.body.ac_name,
        ac_company_lecturer: req.body.ac_company_lecturer,
        ac_description: req.body.ac_description,
        ac_type: req.body.ac_type,
        ac_room: req.body.ac_room || "Unknown",
        ac_seat: req.body.ac_seat ? parseInt(req.body.ac_seat, 10) : 0,
        ac_status: req.body.ac_status,
        ac_location_type: req.body.ac_location_type,
        ac_last_update: new Date(),
        ac_image_data: imageBuffer || req.body.ac_image_data, // ✅ ใช้ภาพใหม่ถ้ามี
      };

      console.log("📝 Updating activity with:", updateData);

      const updatedActivity = await this.activityService.updateActivityService(
        activityId,
        updateData
      );

      if (!updatedActivity) {
        return res.status(404).json({ message: "❌ Activity not found" });
      }

      return res.status(200).json(updatedActivity);
    } catch (error) {
      console.error("❌ Error in updateActivityController:", error);
      return res.status(500).json({ message: "❌ Internal Server Error" });
    }
  };

  searchActivityController = async (req: Request, res: Response) => {
    const { ac_name } = req.query;
    console.log(
      "📩 Received request query in searchActivityController:",
      req.query.ac_name
    );

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
      const id = parseInt(req.params.ac_id, 10);
      console.log(
        "📩 Received request params in deleteActivityController:",
        req.params.ac_id
      );
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
      // ดึง query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // เรียก service พร้อม pagination
      const { activities, total, totalPages } =
        await this.activityService.getAllActivitiesService(page, limit);

      return res
        .status(200)
        .json({ page, limit, total, totalPages, activities });
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

      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      // ✅ สร้าง Object ใหม่เพื่อแปลงรูปภาพ
      const responseActivity = {
        ...activity, // ✅ คัดลอกข้อมูลเดิมทั้งหมด
        ac_image_data:
          activity.ac_image_data instanceof Buffer
            ? `data:image/png;base64,${activity.ac_image_data.toString(
                "base64"
              )}`
            : "/img/default.png", // ✅ ถ้าไม่มี ให้ใช้ Default
      };

      return res.status(200).json(responseActivity);
    } catch (error) {
      console.error("❌ Error in getActivityById:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  };
}
