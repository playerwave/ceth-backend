// src/controllers/Admin/department.controller.ts
import { Request, Response } from "express";
import xss from "xss";
import { DepartmentService } from "../services/department.service";
import { ErrorHandledController } from "./error.handled.controller";

export class DepartmentController extends ErrorHandledController {
  constructor(private readonly departmentService: DepartmentService) {
    super();
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.departmentService.countDepartment();
      res.status(200).json(result);
    } catch (error) {
      this.handleError("DepartmentController.count", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = this.parseOptionalInt(req.query.page, 1);
      const limit = this.parseOptionalInt(req.query.limit, 10);
      const result = await this.departmentService.getDepartment(page, limit);
      res.status(200).json(result);
    } catch (error) {
      this.handleError("DepartmentController.getAll", error, res);
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const department_name = this.sanitize(req.body.department_name);
      const faculty_id = this.parseId(req.body.faculty_id);

      const created = await this.departmentService.addDepartment(
        department_name,
        faculty_id
      );

      if (!created) {
        res.status(409).json({ message: "มีชื่อสาขานี้อยู่ในระบบแล้ว !" });
        return;
      }

      res.status(201).json({ message: "เพิ่มชื่อสาขาสำเร็จ !" });
    } catch (error) {
      this.handleError("DepartmentController.create", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const department_id = this.parseId(req.params.department_id);
      const department_name = this.sanitize(req.body.department_name);
      const faculty_id = this.parseId(req.body.faculty_id);

      const updated = await this.departmentService.updatedDepartmentByName(
        department_id,
        department_name,
        faculty_id
      );

      if (!updated) {
        res.status(409).json({ message: "มีชื่อสาขานี้อยู่ในระบบแล้ว !" });
        return;
      }

      res.status(200).json({ message: "แก้ชื่อสาขาสำเร็จ !" });
    } catch (error) {
      this.handleError("DepartmentController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const department_id = this.parseId(req.params.department_id);

      const deleted = await this.departmentService.deletedDepartment(
        department_id
      );

      if (!deleted) {
        res.status(404).json({ message: "ไม่พบข้อมูลสาขาที่ต้องการลบ !" });
        return;
      }

      res.status(200).json({ message: "ลบชื่อสาขาสำเร็จ !" });
    } catch (error) {
      this.handleError("DepartmentController.delete", error, res);
    }
  }

  private parseId(value: any): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private parseOptionalInt(value: any, fallback: number): number {
    return !isNaN(Number(value)) ? parseInt(value, 10) : fallback;
  }

  private sanitize(input: any): string {
    return xss(input);
  }
}

const departmentService = new DepartmentService();
const controller = new DepartmentController(departmentService);

export const departmentController = {
  count: controller.count.bind(controller),
  getAll: controller.getAll.bind(controller),
  create: controller.create.bind(controller),
  update: controller.update.bind(controller),
  delete: controller.delete.bind(controller),
};
