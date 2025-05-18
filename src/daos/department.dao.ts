import { Repository } from "typeorm";
import { Department } from "../entity/Department";
import { connectDatabase } from "../database/database";

export class DepartmentDao {
    private departmentRepository: Repository<Department> | null = null;

    constructor() {
        connectDatabase().then((connection) => {
            this.departmentRepository = connection.getRepository(Department);
        }).catch((error) => {
            console.log("Database connection failed:", error)
        })
    }

    async getDepartment(): Promise<Department[]> {
        if (!this.departmentRepository) {
            throw new Error("Repository is not initialized");
        }
        try {
            const sql = `SELECT * FROM department`
            const result = await this.departmentRepository.query(sql)
            return result
        } catch (error) {
            throw new Error(`Error from Department Dao Function -> getDepartment : ${error}`);
        }
    }
}