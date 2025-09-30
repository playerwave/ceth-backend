// src/controllers/department.controller.ts
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
      const data = this.parseDepartmentPayload(req.body);

      const result = await this.departmentService.createDepartment(data);

      if (!result) {
        res.status(409).json({ message: "มีชื่อสาขานี้อยู่ในระบบแล้ว !" });
        return;
      }

      res.status(201).json({
        message: "เพิ่มชื่อสาขาสำเร็จ !",
        data: result,
      });
    } catch (error) {
      this.handleError("DepartmentController.create", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.department_id);
      const data = this.parseDepartmentPayload(req.body);

      const result = await this.departmentService.updateDepartment(id, data);

      if (!result) {
        res.status(404).json({ message: "ไม่พบข้อมูลสาขาที่ต้องการแก้ไข !" });
        return;
      }

      res.status(200).json({
        message: "แก้ชื่อสาขาสำเร็จ !",
        data: result,
      });
    } catch (error) {
      this.handleError("DepartmentController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.department_id);
      const forceDelete = req.query.force === "true";

      let result;
      if (forceDelete) {
        result = await this.departmentService.hardDeleteDepartment(id);
      } else {
        result = await this.departmentService.softDeleteDepartment(id);
      }

      if (!result) {
        res.status(404).json({ message: "ไม่พบข้อมูลสาขาที่ต้องการลบ !" });
        return;
      }

      res.status(200).json({
        message: forceDelete
          ? "ลบสาขาสำเร็จ (ถาวร)"
          : "ลบสาขาสำเร็จ (ชั่วคราว)",
      });
    } catch (error) {
      this.handleError("DepartmentController.delete", error, res);
    }
  }

  public async getDepartment(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.department_id);
      const department = await this.departmentService.getDepartmentById(id);

      if (!department) {
        res.status(404).json({ message: "ไม่พบข้อมูลสาขา" });
        return;
      }

      res.status(200).json(department);
    } catch (error) {
      this.handleError("DepartmentController.getDepartment", error, res);
    }
  }

  private parseId(value: string): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private parseOptionalInt(value: any, fallback: number): number {
    return !isNaN(Number(value)) ? parseInt(value, 10) : fallback;
  }

  private parseDepartmentPayload(body: any): any {
    return {
      department_name_tha: body.department_name_tha || "ไม่ระบุ",
      department_name_eng: body.department_name_eng || "ไม่ระบุ",
      department_short_name: body.department_short_name || null,
      faculty_id: this.parseOptionalInt(body.faculty_id, 0),
    };
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
  getDepartment: controller.getDepartment.bind(controller),
};
