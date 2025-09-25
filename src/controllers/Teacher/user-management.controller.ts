import { Request, Response } from "express";
import { UserManagementService } from "../../services/Teacher/user-management.service";

export class UserManagementController {
  private userManagementService: UserManagementService;

  constructor() {
    this.userManagementService = new UserManagementService();
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
