import { Request, Response } from "express";
import { TeacherStudentService } from "../../services/Teacher/teacherStudent.service";
import { ErrorHandledController } from "../error.handled.controller";

export class TeacherStudentController extends ErrorHandledController {
  constructor(private readonly teacherStudentService: TeacherStudentService) {
    super();
  }

  // ================= Upload Students =================
  public async uploadStudents(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "File is required" });
        return;
      }

      console.log(`📤 Starting upload for file: ${req.file.originalname}`);
      const result = await this.teacherStudentService.uploadStudents(req.file);
      
      res.json({
        success: true,
        message: result.message,
        count: result.count,
        errors: result.errors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError("TeacherStudentController.uploadStudents", error, res);
    }
  }

  // ================= Get All Users =================
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.teacherStudentService.getAllUsers();
      res.status(200).json({ count: users.length, users });
    } catch (error) {
      this.handleError("TeacherStudentController.getAllUsers", error, res);
    }
  }

  // ================= Reset All Students =================
  public async resetAllStudents(req: Request, res: Response): Promise<void> {
    try {
      console.log("📤 Starting reset of all students...");
      const result = await this.teacherStudentService.resetAllStudents();
      
      res.status(200).json({
        success: true,
        message: result.message,
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError("TeacherStudentController.resetAllStudents", error, res);
    }
  }

  public async resetStudentTimes(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const result = await this.teacherStudentService.resetStudentTimes(activityId);
      res.status(200).json({
        success: true,
        message: `Reset student times completed for activity ${activityId}`,
        data: result
      });
    } catch (error) {
      this.handleError("ActivityController.resetStudentTimes", error, res);
    }
  }

  // ================= Bulk Check-In/Check-Out Activity =================
  public async bulkCheckIn(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "File is required" });
        return;
      }

      const activityId = this.parseId(req.params.activity_id);

      console.log(`📤 Starting bulk check-in for activity: ${activityId}`);
      const result = await this.teacherStudentService.bulkCheckInOut(req.file, activityId, 'checkin');
      
      res.status(200).json({
        success: true,
        message: result.message,
        processedCount: result.processedCount,
        totalRows: result.totalRows,
        errors: result.errors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError("TeacherStudentController.bulkCheckIn", error, res);
    }
  }

  public async bulkCheckOut(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "File is required" });
        return;
      }

      const activityId = this.parseId(req.params.activity_id);

      console.log(`📤 Starting bulk check-out for activity: ${activityId}`);
      const result = await this.teacherStudentService.bulkCheckInOut(req.file, activityId, 'checkout');
      
      res.status(200).json({
        success: true,
        message: result.message,
        processedCount: result.processedCount,
        totalRows: result.totalRows,
        errors: result.errors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError("TeacherStudentController.bulkCheckOut", error, res);
    }
  }

  // ================= Bulk Enroll Activity =================
  public async bulkEnrollActivity(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "File is required" });
        return;
      }

      const activityId = this.parseId(req.params.activity_id);

      console.log(`📤 Starting bulk enrollment for activity: ${activityId}`);
      const result = await this.teacherStudentService.bulkEnrollActivity(req.file, activityId);
      
      res.status(201).json({
        success: true,
        message: result.message,
        enrolledCount: result.enrolledCount,
        totalRows: result.totalRows,
        errors: result.errors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError("TeacherStudentController.bulkEnrollActivity", error, res);
    }
  }

  // ================= Private Helper Methods =================
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
}

// ✅ สร้าง service instance และ controller instance
const teacherStudentService = new TeacherStudentService();
const controller = new TeacherStudentController(teacherStudentService);

// ✅ Export pattern เหมือนกับ activity controller
export const teacherStudentController = {
  uploadStudents: controller.uploadStudents.bind(controller),
  getAllUsers: controller.getAllUsers.bind(controller),
  resetAllStudents: controller.resetAllStudents.bind(controller),
  bulkCheckIn: controller.bulkCheckIn.bind(controller),
  bulkCheckOut: controller.bulkCheckOut.bind(controller),
  bulkEnrollActivity: controller.bulkEnrollActivity.bind(controller),
  resetStudentTimes: controller.resetStudentTimes.bind(controller),
};
