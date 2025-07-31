// src/controllers/Admin/activity.controller.ts
import { Request, Response } from "express";
import { ActivityService } from "../../services/Teacher/activity.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";

export class ActivityController extends ErrorHandledController {
  constructor(private readonly activityService: ActivityService) {
    super();
  }

  private sanitize(input: any): string {
    return xss(input);
  }

  // public async create(req: Request, res: Response): Promise<void> {
  //   try {
  //     const data = this.parseActivityPayload(req.body);
  //     const result = await this.activityService.createActivity(data);
  //     res.status(201).json(result);
  //   } catch (error) {
  //     this.handleError("ActivityController.create", error, res);
  //   }
  // }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseActivityPayload(req.body);

      // ✅ รองรับ selectedFoods หรือ foodIds
      const foodIds: number[] =
        req.body.selectedFoods || req.body.foodIds || [];

      const result = await this.activityService.createActivity({
        ...data,
        foodIds, // ✅ ส่งต่อชื่อเดียวกันไป service
      });

      res.status(201).json(result);
    } catch (error) {
      this.handleError("ActivityController.create", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const activities = await this.activityService.getAllActivities();
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("ActivityController.getAll", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const data = this.parseActivityPayload(req.body);
      const result = await this.activityService.updateActivity(id, data);

      if (!result) {
        res.status(404).json({ message: "Activity not found" });
        return;
      }

      res.status(200).json({
        message: "Activity updated successfully",
        data: result,
      });
    } catch (error) {
      this.handleError("ActivityController.update", error, res);
    }
  }

  public async updateActivityByStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    const { activity_id } = req.params;
    const { activity_status } = req.body;
    console.log(activity_id);
    const activityIDSanitize = parseInt(this.sanitize(activity_id));
    const activityStatusSanitize = this.sanitize(activity_status);
    // const id = this.parseId(req.params.id);
    // const data = this.parseActivityStatus(req.body);
    try {
      const updated = await this.activityService.updateActivityByStatus(
        activityIDSanitize,
        activityStatusSanitize
      );
      if (updated) {
        res.status(200).json({ message: "เปลี่ยนสถานะสำเร็จ" });
      } else {
        res.status(404).json({ message: "เกิดข้อผิดพลาดในการแก้ไข" });
      }
    } catch (error) {
      this.handleError("ActivityController.updateActivityByStatus", error, res);
    }
  }

  public async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const activity = await this.activityService.getActivityById(id);

      if (!activity) {
        res.status(404).json({ message: "Activity not found" });
        return;
      }

      res.status(200).json(activity);
    } catch (error) {
      this.handleError("ActivityController.getActivity", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const forceDelete = req.query.force === "true"; // ตรวจสอบว่าต้อง hard delete หรือไม่

      let result;
      if (forceDelete) {
        result = await this.activityService.hardDeleteActivity(id);
      } else {
        result = await this.activityService.softDeleteActivity(id);
      }

      if (!result) {
        res.status(404).json({ message: "Activity not found" });
        return;
      }

      res.status(200).json({
        message: forceDelete
          ? "Activity hard deleted successfully"
          : "Activity soft deleted successfully",
      });
    } catch (error) {
      this.handleError("ActivityController.delete", error, res);
    }
  }

  private parseId(value: string): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private parseActivityPayload(body: any): any {
    return {
      activity_name: body.activity_name,
      presenter_company_name: body.presenter_company_name || "",
      type: body.type || "Soft", // ENUM('Soft', 'Hard')
      description: body.description || "",
      seat: this.parseOptionalInt(body.seat) ?? 0, // ✅ ใช้ 0 แทน null
      recieve_hours: this.parseOptionalInt(body.recieve_hours),
      event_format: body.event_format || "Online", // ENUM
      create_activity_date: body.create_activity_date || new Date(),
      special_start_register_date: body.special_start_register_date || null,
      start_register_date: body.start_register_date || null,
      end_register_date: body.end_register_date || null,
      start_activity_date: body.start_activity_date || null,
      end_activity_date: body.end_activity_date || null,
      image_url: body.image_url || "",
      activity_status: body.activity_status || "Private", // ENUM
      activity_state: body.activity_state || "Not Start", // ENUM
      status: body.status || "Active", // ENUM default
      last_update_activity_date: new Date(),
      url: body.url || null,
      assessment_id: this.parseOptionalInt(body.assessment_id),
      room_id: this.parseOptionalInt(body.room_id),
    };
  }

  private parseActivityStatus(body: any): any {
    return {
      activity_status: body.activity_status || "Private",
    };
  }

  private parseOptionalInt(
    value: any,
    fallback: number | null = null
  ): number | null {
    return !isNaN(Number(value)) ? parseInt(value, 10) : fallback;
  }

  private parseFoodInput(input: any): string[] {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === "string") {
      try {
        return JSON.parse(input);
      } catch {
        return [input];
      }
    }
    return [];
  }
}

const activityService = new ActivityService();
const controller = new ActivityController(activityService);

export const activityController = {
  create: controller.create.bind(controller),
  update: controller.update.bind(controller),
  updateByStatus: controller.updateActivityByStatus.bind(controller),
  delete: controller.delete.bind(controller),
  getAll: controller.getAll.bind(controller),
  getActivity: controller.getActivity.bind(controller),
  // getById: controller.getById.bind(controller),
  // search: controller.search.bind(controller),
  // getEnrolledStudents: controller.getEnrolledStudents.bind(controller),
};
