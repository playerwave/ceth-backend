// src/controllers/Admin/activity.controller.ts
import { Request, Response } from "express";
import { ActivityService } from "../../services/Teacher/activity.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";
import { subtract7Hours } from "../../utils/timeUtils";

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
      const data = this.parseUpdatePayload(req.body);

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
    return {
      activity_name: body.activity_name || "ไม่ระบุ",
      presenter_company_name: body.presenter_company_name || "ไม่ระบุ",
      type: body.type || "Soft", // ENUM('Soft', 'Hard')
      description: body.description || "ไม่ระบุ",
      seat: this.parseOptionalInt(body.seat) ?? 0, // ✅ ใช้ 0 แทน null
      recieve_hours: this.parseOptionalInt(body.recieve_hours) ?? 0, // ✅ ใช้ 0 แทน null
      event_format: body.event_format || "Online", // ENUM
      create_activity_date: body.create_activity_date || new Date(),
      // ✅ เก็บเวลาไทยใน database โดยตรง ไม่ลบ 7 ชั่วโมง (เหมือน update)
      special_start_register_date: body.special_start_register_date,
      start_register_date: body.start_register_date,
      end_register_date: body.end_register_date,
      start_activity_date: body.start_activity_date,
      end_activity_date: body.end_activity_date,
      start_assessment: body.start_assessment,
      end_assessment: body.end_assessment,
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

  // ✅ เพิ่ม method สำหรับ update activity ที่ไม่มีการเรียก subtract7Hours
  private parseUpdatePayload(body: any): any {
    return {
      activity_name: body.activity_name || "ไม่ระบุ",
      presenter_company_name: body.presenter_company_name || "ไม่ระบุ",
      type: body.type || "Soft", // ENUM('Soft', 'Hard')
      description: body.description || "ไม่ระบุ",
      seat: this.parseOptionalInt(body.seat) ?? 0, // ✅ ใช้ 0 แทน null
      recieve_hours: this.parseOptionalInt(body.recieve_hours) ?? 0, // ✅ ใช้ 0 แทน null
      event_format: body.event_format || "Online", // ENUM
      create_activity_date: body.create_activity_date || new Date(),
      // ✅ เก็บเวลาไทยใน database โดยตรง ไม่ลบ 7 ชั่วโมง
      special_start_register_date: body.special_start_register_date,
      start_register_date: body.start_register_date,
      end_register_date: body.end_register_date,
      start_activity_date: body.start_activity_date,
      end_activity_date: body.end_activity_date,
      start_assessment: body.start_assessment,
      end_assessment: body.end_assessment,
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

  // ✅ เมธอดใหม่: ดึงข้อมูลนักเรียนที่ลงทะเบียน
  public async getEnrolledStudentsForActivity(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const students = await this.activityService.getEnrolledStudentsForActivity(activityId);
      res.status(200).json(students);
    } catch (error) {
      this.handleError("ActivityController.getEnrolledStudentsForActivity", error, res);
    }
  }

  // ✅ ActivityDetail Controller Methods
  public async getAllActivityDetails(req: Request, res: Response): Promise<void> {
    try {
      const activityDetails = await this.activityService.getAllActivityDetails();
      res.status(200).json(activityDetails);
    } catch (error) {
      this.handleError("ActivityController.getAllActivityDetails", error, res);
    }
  }

  public async getActivityDetailById(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const activityDetail = await this.activityService.getActivityDetailById(id);
      
      if (!activityDetail) {
        res.status(404).json({ message: "Activity detail not found" });
        return;
      }
      
      res.status(200).json(activityDetail);
    } catch (error) {
      this.handleError("ActivityController.getActivityDetailById", error, res);
    }
  }

  public async updateActivityDetail(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const data = req.body;
      const result = await this.activityService.updateActivityDetail(id, data);
      res.status(200).json(result);
    } catch (error) {
      this.handleError("ActivityController.updateActivityDetail", error, res);
    }
  }

  public async resetActivityDetailsAndJoins(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const result = await this.activityService.resetActivityDetailsAndJoins(activityId);
      res.status(200).json({
        success: true,
        message: `DELETE ALL completed for activity ${activityId}`,
        data: result
      });
    } catch (error) {
      this.handleError("ActivityController.resetActivityDetailsAndJoins", error, res);
    }
  }

  public async resetStudentTimes(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const result = await this.activityService.resetStudentTimes(activityId);
      res.status(200).json({
        success: true,
        message: `Reset student times completed for activity ${activityId}`,
        data: result
      });
    } catch (error) {
      this.handleError("ActivityController.resetStudentTimes", error, res);
    }
  }

  public async getActivityDetailsByActivityId(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const activityDetails = await this.activityService.getActivityDetailsByActivityId(activityId);
      
      res.status(200).json(activityDetails);
    } catch (error) {
      this.handleError("ActivityController.getActivityDetailsByActivityId", error, res);
    }
  }

  // ✅ Function 1: ดูนิสิตที่ลงชื่อเข้าร่วมกิจกรรม (มี time_in)
  public async getStudentsCheckedIn(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const students = await this.activityService.getStudentsCheckedIn(activityId);
      
      res.status(200).json({
        success: true,
        message: `Found ${students.length} students who checked in`,
        data: students,
        count: students.length
      });
    } catch (error) {
      this.handleError("ActivityController.getStudentsCheckedIn", error, res);
    }
  }

  // ✅ Function 2: ดูนิสิตที่ลงชื่อออกกิจกรรม (มี time_out)
  public async getStudentsCheckedOut(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const students = await this.activityService.getStudentsCheckedOut(activityId);
      
      res.status(200).json({
        success: true,
        message: `Found ${students.length} students who checked out`,
        data: students,
        count: students.length
      });
    } catch (error) {
      this.handleError("ActivityController.getStudentsCheckedOut", error, res);
    }
  }

  private parseActivityDetailPayload(body: any): any {
    return {
      activity_id: this.parseOptionalInt(body.activity_id),
      activity_food_id: this.parseOptionalInt(body.activity_food_id, null),
      register_date: body.register_date ? new Date(body.register_date) : new Date(),
      time_in: body.time_in ? new Date(body.time_in) : null,
      time_out: body.time_out ? new Date(body.time_out) : null,
      status: body.status || "Registered",
    };
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
  getEnrolledStudentsForActivity: controller.getEnrolledStudentsForActivity.bind(controller),
  // ActivityDetail methods
  getAllActivityDetails: controller.getAllActivityDetails.bind(controller),
  getActivityDetailById: controller.getActivityDetailById.bind(controller),
  getActivityDetailsByActivityId: controller.getActivityDetailsByActivityId.bind(controller),
  updateActivityDetail: controller.updateActivityDetail.bind(controller),
  resetActivityDetailsAndJoins: controller.resetActivityDetailsAndJoins.bind(controller),
  resetStudentTimes: controller.resetStudentTimes.bind(controller),
  // ✅ Check-in/Check-out methods
  getStudentsCheckedIn: controller.getStudentsCheckedIn.bind(controller),
  getStudentsCheckedOut: controller.getStudentsCheckedOut.bind(controller),
  // getEnrolledStudents: controller.getEnrolledStudents.bind(controller),
};
