import { Request, Response } from "express";
import { UserManagementService } from "../../services/Teacher/user-management.service";
import { ErrorHandledController } from "../error.handled.controller";

export class UserManagementController extends ErrorHandledController {
  constructor(private readonly userManagementService: UserManagementService) {
    super();
  }

  getStudentsByDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { departmentCode } = req.params;
      
      console.log(`🔍 [User Management Controller] Getting students for department: ${departmentCode}`);

      if (!departmentCode) {
        res.status(400).json({ 
          success: false, 
          error: "Department code is required" 
        });
        return;
      }

      const result = await this.userManagementService.getStudentsByDepartment(departmentCode);
      
      res.json(result);
    } catch (error) {
      console.error("❌ [User Management Controller] Error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  };

  // ================= Upload Students =================
  public async uploadStudents(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "File is required" });
        return;
      }

      console.log(`📤 Starting upload for file: ${req.file.originalname}`);
      const result = await this.userManagementService.uploadStudents(req.file);
      
      res.json({
        success: true,
        message: result.message,
        count: result.count,
        errors: result.errors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError("UserManagementController.uploadStudents", error, res);
    }
  }

  getAllDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("🔍 [User Management Controller] Getting all departments");

      const result = await this.userManagementService.getAllDepartments();
      
      res.json(result);
    } catch (error) {
      console.error("❌ [User Management Controller] Error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  };
}

// ✅ สร้าง service instance และ controller instance
const userManagementService = new UserManagementService();
const controller = new UserManagementController(userManagementService);

// ✅ Export pattern เหมือนกับ teacherStudent controller
export const userManagementController = {
  getStudentsByDepartment: controller.getStudentsByDepartment.bind(controller),
  uploadStudents: controller.uploadStudents.bind(controller),
  getAllDepartments: controller.getAllDepartments.bind(controller),
};
