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

  public async getSearch(req: Request, res: Response): Promise<void> {
    const text = (req.query.text as string);
    try {
      const activities = await this.activityService.getSearch(text)
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("ActivityController.getSearch", error, res);
    }
  }

  public async getActivityByHistory(req: Request, res: Response): Promise<void> {
    try {
      const activities = await this.activityService.getActivityByHistory();
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("ActivityController.getActivityByHistory", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const data = this.parseActivityPayload(req.body);

      // ✅ เพิ่ม foodIds เข้าไปใน data
      const foodIds: number[] =
        req.body.selectedFoods || req.body.foodIds || [];
      const dataWithFoods = {
        ...data,
        foodIds,
      };

      console.log("Data in controller: ", data);
      console.log("🍽️ Food IDs from request:", foodIds);
      console.log("🍽️ Data with foods:", dataWithFoods);

      const result = await this.activityService.updateActivity(
        id,
        dataWithFoods
      );

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

  // ✅ เพิ่ม search method
  public async search(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.query;
      if (!name || typeof name !== "string") {
        res.status(400).json({ message: "Search term 'name' is required" });
        return;
      }

      const activities = await this.activityService.searchActivities(name);
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("ActivityController.search", error, res);
    }
  }

  private parseId(value: string): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private parseActivityPayload(body: any): any {
    // ✅ เพิ่ม debug log
    console.log("🔍 Parsing activity payload:", {
      assessment_id: body.assessment_id,
      room_id: body.room_id,
      assessment_id_type: typeof body.assessment_id,
      room_id_type: typeof body.room_id,
    });

    return {
      activity_name: body.activity_name || "ไม่ระบุ",
      presenter_company_name: body.presenter_company_name || "ไม่ระบุ",
      type: body.type || "Soft", // ENUM('Soft', 'Hard')
      description: body.description || "ไม่ระบุ",
      seat: this.parseOptionalInt(body.seat) ?? 0, // ✅ ใช้ 0 แทน null
      recieve_hours: this.parseOptionalInt(body.recieve_hours) ?? 0, // ✅ ใช้ 0 แทน null
      event_format: body.event_format || "Online", // ENUM
      create_activity_date: body.create_activity_date || new Date(),
      // ✅ ส่งผ่านค่าเวลาแบบเดิม (string) โดยไม่แปลง timezone
      special_start_register_date: body.special_start_register_date ?? null,
      start_register_date: body.start_register_date ?? null,
      end_register_date: body.end_register_date ?? null,
      start_activity_date: body.start_activity_date ?? null,
      end_activity_date: body.end_activity_date ?? null,
      start_assessment: body.start_assessment ?? null,
      end_assessment: body.end_assessment ?? null,
      image_url: body.image_url || "ไม่ระบุ",
      activity_status: body.activity_status || "Private", // ENUM
      activity_state: body.activity_state || "Not Start", // ENUM
      status: body.status || "Active", // ENUM default
      last_update_activity_date: new Date(),
      url: body.url || "ไม่ระบุ",
      assessment_id: this.parseOptionalInt(body.assessment_id, null),
      room_id: this.parseOptionalInt(body.room_id, null),
    };
  }

  private parseDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;

    try {
      console.log(`🔍 Parsing date: ${dateString}`);

      // ✅ ตรวจสอบว่าเป็น UTC format หรือ local format
      if (dateString.includes("Z") || dateString.includes("+")) {
        // เป็น UTC format ให้แปลงเป็น local time
        const date = new Date(dateString);
        console.log(
          `📅 UTC format detected, converted to: ${date.toISOString()}`
        );
        return date;
      } else {
        // เป็น local format (YYYY-MM-DD HH:mm:ss)
        const parts = dateString.split(" ");
        if (parts.length !== 2) {
          console.error("❌ Invalid date format:", dateString);
          return null;
        }

        const [datePart, timePart] = parts;
        const [year, month, day] = datePart.split("-");
        const [hours, minutes, seconds] = timePart.split(":");

        // ✅ สร้าง Date object ใน local timezone โดยตรง
        const date = new Date();
        date.setFullYear(parseInt(year));
        date.setMonth(parseInt(month) - 1);
        date.setDate(parseInt(day));
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        date.setSeconds(parseInt(seconds || "0"));
        date.setMilliseconds(0);

        console.log(`📅 Local format detected, created: ${date.toISOString()}`);
        return date;
      }
    } catch (error) {
      console.error("❌ Error parsing date:", dateString, error);
      return null;
    }
  }

  private parseOptionalInt(
    value: any,
    fallback: number | null = null
  ): number | null {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    const parsed = parseInt(value, 10);
    return !isNaN(parsed) ? parsed : fallback;
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
  getActivityByHistory: controller.getActivityByHistory.bind(controller),
  getSearch: controller.getSearch.bind(controller),
  // getById: controller.getById.bind(controller),
  search: controller.search.bind(controller), // ✅ เพิ่ม search method
  // getEnrolledStudents: controller.getEnrolledStudents.bind(controller),
};
