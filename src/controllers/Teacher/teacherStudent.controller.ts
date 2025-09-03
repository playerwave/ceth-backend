import { Request, Response } from "express";
import { TeacherStudentService } from "../../services/Teacher/teacherStudent.service";

const studentService = new TeacherStudentService();

export class TeacherStudentController {

  // ================= Upload Students =================
  public async uploadStudents(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "File is required" });
        return;
      }

      console.log(`📤 Starting upload for file: ${req.file.originalname}`);
      const result = await studentService.uploadStudents(req.file);
      
      res.json({
        success: true,
        message: result.message,
        count: result.count,
        errors: result.errors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Controller error:", error);
      res.status(500).json({ error: "Failed to upload students" });
    }
  }

  // ================= Get All Users =================
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await studentService.getAllUsers();
      res.json({ count: users.length, users });
    } catch (error) {
      console.error("❌ Controller error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  // ================= Reset All Students =================
  public async resetAllStudents(req: Request, res: Response): Promise<void> {
    try {
      console.log("📤 Starting reset of all students...");
      const result = await studentService.resetAllStudents();
      
      res.json({
        success: true,
        message: result.message,
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Controller error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to reset students",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString()
      });
    }
  }

  // ================= Bulk Enroll Activity =================
  public async bulkEnrollActivity(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "File is required" });
        return;
      }

      const { activity_id } = req.params;
      if (!activity_id || isNaN(Number(activity_id))) {
        res.status(400).json({ error: "Valid activity_id is required" });
        return;
      }

      console.log(`📤 Starting bulk enrollment for activity: ${activity_id}`);
      const result = await studentService.bulkEnrollActivity(req.file, Number(activity_id));
      
      res.json({
        success: true,
        message: result.message,
        enrolledCount: result.enrolledCount,
        totalRows: result.totalRows,
        errors: result.errors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Controller error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to bulk enroll students",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString()
      });
    }
  }
}
