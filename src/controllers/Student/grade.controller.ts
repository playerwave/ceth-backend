// src/controllers/Admin/grade.controller.ts
import { Request, Response } from "express";
import { GradeService } from "../../services/Student/grade.service";
import { ErrorHandledController } from "../error.handled.controller";

export class GradeController extends ErrorHandledController {
  constructor(private readonly gradeService: GradeService) {
    super();
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.gradeService.countGrade();
      res.status(200).json({ count });
    } catch (error) {
      this.handleError("GradeController.count", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const grades = await this.gradeService.getGrade();
      res.status(200).json(grades);
    } catch (error) {
      this.handleError("GradeController.getAll", error, res);
    }
  }

  private parseId(value: string): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }
}

// สำหรับ binding controller
const gradeService = new GradeService();
const controller = new GradeController(gradeService);

export const gradeController = {
  count: controller.count.bind(controller),
  getAll: controller.getAll.bind(controller),
};
