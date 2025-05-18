import { Router } from "express";
import { DepartmentController } from "../controllers/department.controller";
import { Request, Response } from "express";
const router = Router();

const departmentController = new DepartmentController()

router.get("/data", async (req: Request, res: Response) => {
    await departmentController.getDepartment(req, res)
})

export default router
