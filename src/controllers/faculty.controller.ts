import { Request, Response } from "express";
import { FacultyService } from "../services/faculty.service";
import { ErrorHandledController } from "./error.handled.controller";
import xss from "xss";

export class FacultyController extends ErrorHandledController {
  constructor(
    private readonly facultyService: FacultyService = new FacultyService()
  ) {
    super();
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.facultyService.countFaculty();
      res.status(200).json(result);
    } catch (error) {
      this.handleError("FacultyController.count", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.facultyService.getFaculty(page, limit);
      res.status(200).json(result);
    } catch (error) {
      this.handleError("FacultyController.getAll", error, res);
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const facultyName = this.sanitizeInput(req.body.faculty_name);
      const result = await this.facultyService.addFaculty(facultyName);

      if (result) {
        res.status(201).json({ message: "เพิ่มชื่อคณะสำเร็จ !" });
      } else {
        res.status(400).json({ message: "มีชื่อคณะนี้อยูในระบบแล้ว !" });
      }
    } catch (error) {
      this.handleError("FacultyController.create", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.faculty_id);
      const name = this.sanitizeInput(req.body.faculty_name);
      const result = await this.facultyService.updateFacultyByName(id, name);

      if (result) {
        res.status(200).json({ message: "แก้ชื่อคณะสำเร็จ !" });
      } else {
        res.status(400).json({ message: "มีชื่อคณะนี้อยูในระบบแล้ว !" });
      }
    } catch (error) {
      this.handleError("FacultyController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.faculty_id);
      const result = await this.facultyService.deleteFaculty(id);

      if (result) {
        res.status(200).json({ message: "ลบชื่อคณะสำเร็จ !" });
      } else {
        res.status(404).json({ message: "ไม่พบข้อมูลคณะที่ต้องการลบ !" });
      }
    } catch (error) {
      this.handleError("FacultyController.delete", error, res);
    }
  }

  private parseId(value: string): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private sanitizeInput(input: any): string {
    return xss(input);
  }
}

const facultyService = new FacultyService();
const controller = new FacultyController(facultyService);

export const facultyController = {
  count: controller.count.bind(controller),
  getAll: controller.getAll.bind(controller),
  create: controller.create.bind(controller),
  update: controller.update.bind(controller),
  delete: controller.delete.bind(controller),
};
