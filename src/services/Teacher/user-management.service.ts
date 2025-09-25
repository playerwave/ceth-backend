import { UserManagementDAO } from "../../daos/Teacher/user-management.dao";

export class UserManagementService {
  private userManagementDAO: UserManagementDAO;

  constructor() {
    this.userManagementDAO = new UserManagementDAO();
  }

  async getStudentsByDepartment(departmentShortName: string): Promise<any> {
    try {
      console.log(`🔍 [User Management Service] Getting students for department: ${departmentShortName}`);
      
      const students = await this.userManagementDAO.getStudentsByDepartmentShortName(departmentShortName);
      
      console.log(`📊 [User Management Service] Found ${students.length} students`);
      
      return {
        success: true,
        data: students,
        department: departmentShortName,
        count: students.length
      };
    } catch (error) {
      console.error("❌ [User Management Service] Error:", error);
      throw error;
    }
  }

  async getAllDepartments(): Promise<any> {
    try {
      console.log("🔍 [User Management Service] Getting all departments");
      
      const departments = await this.userManagementDAO.getAllDepartments();
      
      console.log(`📊 [User Management Service] Found ${departments.length} departments`);
      
      return {
        success: true,
        data: departments,
        count: departments.length
      };
    } catch (error) {
      console.error("❌ [User Management Service] Error:", error);
      throw error;
    }
  }
}
