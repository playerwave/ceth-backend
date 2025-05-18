import { DepartmentDao } from "../daos/department.dao";
import { Department } from "../entity/Department";

export class DepartmentService {
    private departmentDao = new DepartmentDao

    async getDepartment(): Promise<Department[]> {
        return await this.departmentDao.getDepartment()
    }
}