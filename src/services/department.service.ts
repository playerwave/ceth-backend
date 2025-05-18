import { DepartmentDao } from "../daos/Admin/department.dao";
import { Department } from "../interfaces/Department";

export class DepartmentService {
  private departmentDao = new DepartmentDao();

  async getAllDepartments(): Promise<Department[]> {
    return this.departmentDao.getAllDepartments();
  }

  async getDepartmentById(id: number): Promise<Department | null> {
    return this.departmentDao.getDepartmentById(id);
  }
}
