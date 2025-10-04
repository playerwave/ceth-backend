import { Request, Response } from "express";
import { ErrorHandledController } from "../error.handled.controller";
import { GradeService } from "../../services/Student/grade.service";
import { CreateGradeDto, UpdateGradeDto } from "../../dtos/Student/grade.dto";

export class GradeController extends ErrorHandledController {
  constructor(private readonly gradeService = new GradeService()) {
    super();
  }

  protected handleError(context: string, error: unknown, res: Response): void {
    console.error(`❌ Error in ${context}:`, error);
    res.status(500).json({ 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
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

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const grade_id = parseInt(req.params.grade_id);
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
      const grade_id = parseInt(req.params.grade_id);
      const data: UpdateGradeDto = req.body;
      
      console.log(`🔍 [CONTROLLER] Updating grade_id: ${grade_id}`);
      console.log(`🔍 [CONTROLLER] Request body:`, data);
      console.log(`🔍 [CONTROLLER] Parsed grade_id:`, grade_id);
      
      const grade = await this.gradeService.updateGrade(grade_id, data);
      console.log(`🔍 [CONTROLLER] Service result:`, grade);

      if (!grade) {
        console.log(`❌ [CONTROLLER] Grade not found or update failed`);
        res.status(404).json({
          message: "ไม่พบระดับชั้นที่ระบุ หรือไม่สามารถอัปเดตได้",
        });
        return;
      }

      console.log(`✅ [CONTROLLER] Grade updated successfully`);
      res.status(200).json({
        grade,
        message: "อัปเดตระดับชั้นสำเร็จ",
      });
    } catch (error) {
      console.error(`❌ [CONTROLLER] Error in update:`, error);
      this.handleError("GradeController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const grade_id = parseInt(req.params.grade_id);
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
}

// Singleton instance with proper binding
const gradeControllerInstance = new GradeController();

export const gradeController = {
  getAll: gradeControllerInstance.getAll.bind(gradeControllerInstance),
  count: gradeControllerInstance.count.bind(gradeControllerInstance),
  create: gradeControllerInstance.create.bind(gradeControllerInstance),
  getById: gradeControllerInstance.getById.bind(gradeControllerInstance),
  update: gradeControllerInstance.update.bind(gradeControllerInstance),
  delete: gradeControllerInstance.delete.bind(gradeControllerInstance),
};
