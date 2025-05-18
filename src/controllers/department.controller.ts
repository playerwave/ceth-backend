
import { DepartmentService } from "../services/department.service";
import { Request, Response } from "express";
export class DepartmentController {
    private departmentService = new DepartmentService()

    getDepartment = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.departmentService.getDepartment();
            // return result
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(`Error fetching Department data : ${error}`);
        }
    }
}