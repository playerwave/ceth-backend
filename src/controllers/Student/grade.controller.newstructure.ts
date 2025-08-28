// src/controllers/Student/grade.controller.newstructure.ts
import { Request, Response } from "express";
import { GradeService } from "../../services/Student/grade.service.newstructure";
import { ErrorHandledController } from "../error.handled.controller";
import { CreateGradeDto, UpdateGradeDto } from "../../dtos/Student/grade.dto";

export class GradeController extends ErrorHandledController {
  constructor(private readonly gradeService: GradeService) {
    super();
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateGradeDto = req.body;
      const grade = await this.gradeService.createGrade(data);

      if (!grade) {
        res.status(400).json({
          message: "ไม่สามารถสร้างระดับชั้นได้ - อาจมีระดับชั้นนี้อยู่แล้ว",
        });
        return;
      }

      res.status(201).json({
        grade,
        message: "สร้างระดับชั้นสำเร็จ",
      });
    } catch (error) {
      this.handleError("GradeController.create", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const grades = await this.gradeService.getGrades();
      res.status(200).json({
        grades,
        count: grades.length,
        notification: "เชื่อมต่อข้อมูลระดับชั้นสำเร็จ",
      });
    } catch (error) {
      this.handleError("GradeController.getAll", error, res);
    }
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.gradeService.countGrades();
      res.status(200).json({
        count,
        notification: "นับจำนวนระดับชั้นสำเร็จ",
      });
    } catch (error) {
      this.handleError("GradeController.count", error, res);
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const grade_id = this.parseId(req.params.grade_id);
      const grade = await this.gradeService.getGradeById(grade_id);

      if (!grade) {
        res.status(404).json({
          message: "ไม่พบระดับชั้นที่ระบุ",
        });
        return;
      }

      res.status(200).json({
        grade,
        notification: "เชื่อมต่อข้อมูลระดับชั้นสำเร็จ",
      });
    } catch (error) {
      this.handleError("GradeController.getById", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const grade_id = this.parseId(req.params.grade_id);
      const data: UpdateGradeDto = req.body;
      const grade = await this.gradeService.updateGrade(grade_id, data);

      if (!grade) {
        res.status(404).json({
          message: "ไม่พบระดับชั้นที่ระบุ หรือไม่สามารถอัปเดตได้",
        });
        return;
      }

      res.status(200).json({
        grade,
        message: "อัปเดตระดับชั้นสำเร็จ",
      });
    } catch (error) {
      this.handleError("GradeController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const grade_id = this.parseId(req.params.grade_id);
      const deleted = await this.gradeService.deleteGrade(grade_id);

      if (!deleted) {
        res.status(404).json({
          message: "ไม่พบระดับชั้นที่ระบุ",
        });
        return;
      }

      res.status(200).json({
        message: "ลบระดับชั้นสำเร็จ",
      });
    } catch (error) {
      this.handleError("GradeController.delete", error, res);
    }
  }

  private parseId(value: string): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }
}

const gradeService = new GradeService();
const controller = new GradeController(gradeService);

export const gradeController = {
  create: controller.create.bind(controller),
  getAll: controller.getAll.bind(controller),
  count: controller.count.bind(controller),
  getById: controller.getById.bind(controller),
  update: controller.update.bind(controller),
  delete: controller.delete.bind(controller),
};
