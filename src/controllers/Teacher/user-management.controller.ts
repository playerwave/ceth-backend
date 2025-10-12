import { Request, Response } from "express";
import { UserManagementService } from "../../services/Teacher/user-management.service";
import { ErrorHandledController } from "../error.handled.controller";

export class UserManagementController extends ErrorHandledController {
  constructor(private readonly userManagementService: UserManagementService) {
    super();
  }

  // ================= Get All Students =================
  getAllStudents = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("🔍 [User Management Controller] Getting all students");

      const result = await this.userManagementService.getAllStudents();
      
      res.json(result);
    } catch (error) {
      console.error("❌ [User Management Controller] Error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  };

  // ================= Get Students By Department =================
  getStudentsByDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { departmentCode } = req.params;
      

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

  // ================= Review Upload Data =================
  public async reviewUploadData(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
        return;
      }

      
      const result = await this.userManagementService.reviewUploadData(req.file);
      
      res.status(200).json({
        success: true,
        message: "Upload review completed successfully",
        data: result
      });
    } catch (error) {
      this.handleError("UserManagementController.reviewUploadData", error, res);
    }
  }

  // ================= Update Grade Year =================
  public async updateGradeYear(req: Request, res: Response): Promise<void> {
    try {
      console.log("🔄 Starting grade year update process...");
      
      const result = await this.userManagementService.updateGradeYear();
      
      res.status(200).json({
        success: true,
        message: "Grade year update completed successfully",
        data: result
      });
    } catch (error) {
      this.handleError("UserManagementController.updateGradeYear", error, res);
    }
  }

  // ================= Rollback Grade Year =================
  public async rollbackGradeYear(req: Request, res: Response): Promise<void> {
    try {
      console.log("🔄 Starting grade year rollback process...");
      
      const result = await this.userManagementService.rollbackGradeYear();
      
      res.status(200).json({
        success: true,
        message: "Grade year rollback completed successfully",
        data: result
      });
    } catch (error) {
      this.handleError("UserManagementController.rollbackGradeYear", error, res);
    }
  }
}

// ✅ สร้าง service instance และ controller instance
const userManagementService = new UserManagementService();
const controller = new UserManagementController(userManagementService);

// ✅ Export pattern เหมือนกับ teacherStudent controller
export const userManagementController = {
  getAllStudents: controller.getAllStudents.bind(controller),
  getStudentsByDepartment: controller.getStudentsByDepartment.bind(controller),
  uploadStudents: controller.uploadStudents.bind(controller),
  getAllDepartments: controller.getAllDepartments.bind(controller),
  reviewUploadData: controller.reviewUploadData.bind(controller),
  updateGradeYear: controller.updateGradeYear.bind(controller),
  rollbackGradeYear: controller.rollbackGradeYear.bind(controller),
};
