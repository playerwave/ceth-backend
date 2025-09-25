import { getConnection } from "typeorm";
import { Students } from "../../entity/students.entity";
import { Department } from "../../entity/department.entity";

export class UserManagementDAO {
  private getStudentsRepository() {
    return getConnection().getRepository(Students);
  }

  private getDepartmentRepository() {
    return getConnection().getRepository(Department);
  }

  async getStudentsByDepartmentShortName(departmentShortName: string): Promise<any[]> {
    try {
      const studentsRepository = this.getStudentsRepository();
      const departmentRepository = this.getDepartmentRepository();

      // Find department by short name
      const department = await departmentRepository.findOne({
        where: { department_short_name: departmentShortName }
      });

      if (!department) {
        throw new Error(`Department with short name '${departmentShortName}' not found`);
      }

      // Get students by department
      const students = await studentsRepository
        .createQueryBuilder("student")
        .leftJoinAndSelect("student.department", "department")
        .leftJoinAndSelect("student.faculty", "faculty")
        .where("student.department_id = :departmentId", { departmentId: department.department_id })
        .getMany();

      return students;
    } catch (error) {
      console.error("❌ [User Management DAO] Error:", error);
      throw error;
    }
  }

  async getAllDepartments(): Promise<any[]> {
    try {
      const departmentRepository = this.getDepartmentRepository();
      const departments = await departmentRepository.find();
      return departments;
    } catch (error) {
      console.error("❌ [User Management DAO] Error:", error);
      throw error;
    }
  }
}
