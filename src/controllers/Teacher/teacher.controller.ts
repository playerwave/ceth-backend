import { Request, Response } from "express";
import { TeacherService } from "../../services/Teacher/teacher.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";

export class TeacherController extends ErrorHandledController {
  constructor(
    private readonly teacherService: TeacherService = new TeacherService()
  ) {
    super();
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.teacherService.countTeacher();
      res.status(200).json({ count });
    } catch (error) {
      this.handleError("TeacherController.count", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const teachers = await this.teacherService.getTeacher();
      res.status(200).json(teachers);
    } catch (error) {
      this.handleError("TeacherController.getAll", error, res);
    }
  }

  public async getTeacherSuccess(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const teachers = await this.teacherService.getTeacherSuccess(page, limit);
      res.status(200).json(teachers);
    } catch (error) {
      this.handleError("TeacherController.getTeacherSuccess", error, res);
    }
  }

  public async getPaginated(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const teachers = await this.teacherService.getTeacherSuccess(page, limit);
      res.status(200).json(teachers);
    } catch (error) {
      this.handleError("TeacherController.getPaginated", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.teacher_id);
      const payload = this.parseUpdatePayload(req.body);

      const updated = await this.teacherService.updatedTeacher(
        id,
        payload.first_name,
        payload.last_name,
        payload.faculty_id
      );

      if (!updated) {
        res.status(404).json({ message: "Teacher not found" });
        return;
      }

      res.status(200).json({ message: "Teacher updated successfully" });
    } catch (error) {
      this.handleError("TeacherController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.teacher_id);
      const deleted = await this.teacherService.deletedTeacher(id);

      if (!deleted) {
        res.status(404).json({ message: "Teacher not found" });
        return;
      }

      res.status(200).json({ message: "Teacher deleted successfully" });
    } catch (error) {
      this.handleError("TeacherController.delete", error, res);
    }
  }

  private parseId(value: string): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private sanitize(value: any): string {
    return xss(value);
  }

  private parseUpdatePayload(body: any): {
    first_name: string | null;
    last_name: string | null;
    faculty_id: number | null;
  } {
    return {
      first_name: body.first_name ? this.sanitize(body.first_name) : null,
      last_name: body.last_name ? this.sanitize(body.last_name) : null,
      faculty_id: body.faculty_id
        ? parseInt(this.sanitize(body.faculty_id))
        : null,
    };
  }
}

// Export ready-to-bind instance
const teacherService = new TeacherService();
const controller = new TeacherController(teacherService);

export const teacherController = {
  count: controller.count.bind(controller),
  getAll: controller.getAll.bind(controller),
  getPaginated: controller.getPaginated.bind(controller),
  update: controller.update.bind(controller),
  delete: controller.delete.bind(controller),
};
