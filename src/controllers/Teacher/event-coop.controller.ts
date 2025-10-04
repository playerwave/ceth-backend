import { Request, Response } from "express";
import { EventCoopService } from "../../services/Teacher/event-coop.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";

export class EventCoopController extends ErrorHandledController {
  constructor(private readonly eventCoopService: EventCoopService) {
    super();
  }

  private sanitize(input: any): string {
    return xss(input);
  }

  /**
   * ดึงข้อมูล Event Coop ตาม Department
   */
  public async getEventCoopByDepartment(req: Request, res: Response): Promise<void> {
    try {
      const departmentId = this.parseId(req.params.departmentId);
      
      const eventCoops = await this.eventCoopService.getEventCoopByDepartment(departmentId);
      
      res.status(200).json({
        success: true,
        message: `Found ${eventCoops.length} event coops for department ${departmentId}`,
        data: eventCoops,
        count: eventCoops.length
      });
    } catch (error) {
      this.handleError("EventCoopController.getEventCoopByDepartment", error, res);
    }
  }

  /**
   * ดึงข้อมูล Event Coop ตาม ID
   */
  public async getEventCoopById(req: Request, res: Response): Promise<void> {
    try {
      const eventCoopId = this.parseId(req.params.eventCoopId);
      
      const eventCoop = await this.eventCoopService.getEventCoopById(eventCoopId);
      
      if (!eventCoop) {
        res.status(404).json({
          success: false,
          message: "Event coop not found"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Event coop retrieved successfully",
        data: eventCoop
      });
    } catch (error) {
      this.handleError("EventCoopController.getEventCoopById", error, res);
    }
  }

  /**
   * อัปเดตข้อมูล Event Coop (Partial Update - PATCH)
   */
  public async updateEventCoop(req: Request, res: Response): Promise<void> {
    try {
      const eventCoopId = this.parseId(req.params.eventCoopId);
      const data = this.parseUpdatePayload(req.body);

      console.log(`🔄 [CONTROLLER] Updating EventCoop ID: ${eventCoopId} with data:`, data);
      console.log(`🔄 [CONTROLLER] is_on_coop value:`, data.is_on_coop);

      const updatedEventCoop = await this.eventCoopService.updateEventCoop(eventCoopId, data);
      
      if (!updatedEventCoop) {
        res.status(404).json({
          success: false,
          message: "Event coop not found"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Event coop updated successfully",
        data: updatedEventCoop
      });
    } catch (error) {
      this.handleError("EventCoopController.updateEventCoop", error, res);
    }
  }

  /**
   * สร้าง Event Coop ใหม่
   */
  public async createEventCoop(req: Request, res: Response): Promise<void> {
    try {
      console.log("🆕 Creating new event coop", { body: req.body });
      
      const data = this.parseCreatePayload(req.body);

      const newEventCoop = await this.eventCoopService.createEventCoop(data);
      
      console.log("✅ Event coop created successfully", { 
        eventCoopId: newEventCoop.eventcoop_id 
      });
      
      res.status(201).json({
        success: true,
        message: "Event coop created successfully",
        data: newEventCoop
      });
    } catch (error) {
      console.error("❌ Error creating event coop:", error);
      this.handleError("EventCoopController.createEventCoop", error, res);
    }
  }

  /**
   * ลบ Event Coop
   */
  public async deleteEventCoop(req: Request, res: Response): Promise<void> {
    try {
      const eventCoopId = this.parseId(req.params.eventCoopId);

      const deleted = await this.eventCoopService.deleteEventCoop(eventCoopId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Event coop not found"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Event coop deleted successfully"
      });
    } catch (error) {
      this.handleError("EventCoopController.deleteEventCoop", error, res);
    }
  }

  /**
   * ดึงข้อมูล Event Coop ทั้งหมด
   */
  public async getAllEventCoops(req: Request, res: Response): Promise<void> {
    try {
      const eventCoops = await this.eventCoopService.getAllEventCoops();
      
      res.status(200).json({
        success: true,
        message: `Found ${eventCoops.length} event coops`,
        data: eventCoops,
        count: eventCoops.length
      });
    } catch (error) {
      this.handleError("EventCoopController.getAllEventCoops", error, res);
    }
  }

  private parseId(value: string): number {
    console.log(`🔍 parseId: Received value: "${value}", type: ${typeof value}`);
    
    if (typeof value !== 'string' || value.trim() === '') {
      console.error(`❌ parseId: Invalid value type or empty: ${value}`);
      throw new Error("Invalid ID format: Value must be a non-empty string");
    }
    
    const cleanValue = value.trim();
    if (!/^\d+$/.test(cleanValue)) {
      console.error(`❌ parseId: Value contains non-numeric characters: "${cleanValue}"`);
      throw new Error(`Invalid ID format: "${cleanValue}" is not a valid number`);
    }
    
    const id = parseInt(cleanValue, 10);
    if (isNaN(id)) {
      console.error(`❌ parseId: parseInt failed for value: "${cleanValue}"`);
      throw new Error("Invalid ID format: Failed to parse number");
    }
    
    console.log(`✅ parseId: Successfully parsed ID: ${id}`);
    return id;
  }

  private parseUpdatePayload(body: any): any {
    const sanitizedData: any = {};

    if (body.department_id !== undefined) {
      sanitizedData.department_id = this.parseOptionalInt(body.department_id);
    }

    if (body.grade_id !== undefined) {
      sanitizedData.grade_id = this.parseOptionalInt(body.grade_id);
    }

    if (body.date !== undefined) {
      sanitizedData.date = this.parseDate(body.date);
    }

    if (body.remaining_days !== undefined) {
      sanitizedData.remaining_days = this.parseOptionalInt(body.remaining_days);
    }

    if (body.is_on_coop !== undefined) {
      sanitizedData.is_on_coop = Boolean(body.is_on_coop);
    }

    return sanitizedData;
  }

  private parseCreatePayload(body: any): any {
    const departmentId = this.parseRequiredInt(body.department_id, "Department ID is required");
    const gradeId = this.parseRequiredInt(body.grade_id, "Grade ID is required");
    const date = this.parseDate(body.date); // เปลี่ยนเป็น parseDate (optional)
    
    // คำนวณ remaining_days จากวันที่ปัจจุบัน (ถ้ามี date)
    let calculatedRemainingDays = null;
    if (date) {
      const today = new Date();
      const eventDate = new Date(date);
      const diffTime = eventDate.getTime() - today.getTime();
      calculatedRemainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`📅 Auto-calculated remaining days: ${calculatedRemainingDays}`, {
        today: today.toISOString(),
        eventDate: eventDate.toISOString()
      });
    } else {
      console.log(`📅 No date provided, remaining_days will be null`);
    }
    
    return {
      department_id: departmentId,
      grade_id: gradeId,
      date: date,
      remaining_days: calculatedRemainingDays // ใช้ค่าที่คำนวณได้ หรือ null
    };
  }

  private parseDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;

    try {
      console.log(`🔍 Parsing date: ${dateString}`);

      if (dateString.includes("Z") || dateString.includes("+")) {
        const date = new Date(dateString);
        console.log(`📅 UTC format detected, using as is: ${date.toISOString()}`);
        return date;
      } else {
        const cleanDateString = dateString.replace('T', ' ').split('.')[0];
        const parts = cleanDateString.split(" ");
        
        if (parts.length !== 2) {
          console.error("❌ Invalid date format:", dateString);
          return null;
        }

        const [datePart, timePart] = parts;
        const [year, month, day] = datePart.split("-");
        const [hours, minutes, seconds] = timePart.split(":");

        const localDate = new Date();
        localDate.setFullYear(parseInt(year));
        localDate.setMonth(parseInt(month) - 1);
        localDate.setDate(parseInt(day));
        localDate.setHours(parseInt(hours));
        localDate.setMinutes(parseInt(minutes));
        localDate.setSeconds(parseInt(seconds || "0"));
        localDate.setMilliseconds(0);

        const utcDate = new Date(localDate.getTime() - (7 * 60 * 60 * 1000));
        
        console.log(`📅 Local format detected: ${dateString}`);
        console.log(`📅 Local time: ${localDate.toISOString()}`);
        console.log(`📅 Converted to UTC: ${utcDate.toISOString()}`);
        
        return utcDate;
      }
    } catch (error) {
      console.error("❌ Error parsing date:", dateString, error);
      return null;
    }
  }

  private parseOptionalInt(value: any, fallback: number | null = null): number | null {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    const parsed = parseInt(value, 10);
    return !isNaN(parsed) ? parsed : fallback;
  }

  private parseRequiredInt(value: any, errorMessage: string): number {
    if (value === null || value === undefined || value === "") {
      throw new Error(errorMessage);
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`${errorMessage} and must be a valid number`);
    }
    return parsed;
  }

  private parseRequiredDate(value: any, errorMessage: string): Date {
    if (!value) {
      throw new Error(errorMessage);
    }
    const parsed = this.parseDate(value);
    if (!parsed) {
      throw new Error(`${errorMessage} and must be a valid date`);
    }
    return parsed;
  }
}

const eventCoopService = new EventCoopService();
const controller = new EventCoopController(eventCoopService);

export const eventCoopController = {
  getEventCoopByDepartment: controller.getEventCoopByDepartment.bind(controller),
  getEventCoopById: controller.getEventCoopById.bind(controller),
  updateEventCoop: controller.updateEventCoop.bind(controller),
  createEventCoop: controller.createEventCoop.bind(controller),
  deleteEventCoop: controller.deleteEventCoop.bind(controller),
  getAllEventCoops: controller.getAllEventCoops.bind(controller)
};
