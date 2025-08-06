// src/controllers/student.controller.ts
import { Request, Response } from "express";
import { StudentsService } from "../../services/Student/student.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";
import { Students } from "../../entity/students.entity";

export class StudentsController extends ErrorHandledController {
  constructor(private readonly studentsService = new StudentsService()) {
    super();
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.studentsService.countStudents();
      res.status(200).json(result);
    } catch (error) {
      this.handleError("StudentsController.count", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.studentsService.getStudents();
      res.status(200).json(result);
    } catch (error) {
      this.handleError("StudentsController.getAll", error, res);
    }
  }

  public async getPaginated(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    try {
      const result = await this.studentsService.getStudentsSuccess(page, limit);
      res.status(200).json(result);
    } catch (error) {
      this.handleError("StudentsController.getPaginated", error, res);
    }
  }

  public async getStudentsSuccess(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.studentsService.getStudentsSuccess(page, limit);
      res.status(200).json(result);
    } catch (error) {
      this.handleError("StudentsController.getStudentsSuccess", error, res);
    }
  }

  // public async create(req: Request, res: Response): Promise<void> {
  //   try {
  //     const data = this.parseStudentPayload(req.body);
  //     const created = await this.studentsService.addStudents(...data);
  //     if (!created) {
  //       res.status(409).json({ message: "มีข้อมูลนิสิตนี้อยู่ในระบบแล้ว!" });
  //       return;
  //     }
  //     res.status(201).json({ message: "เพิ่มข้อมูลนิสิตสำเร็จ!" });
  //   } catch (error) {
  //     this.handleError("StudentsController.create", error, res);
  //   }
  // }

  // public async update(req: Request, res: Response): Promise<void> {
  //   try {
  //     const id = this.parseId(req.params.students_id);
  //     const data = this.parseStudentPayload(req.body);
  //     const updated = await this.studentsService.updatedStudents(id, ...data);
  //     if (!updated) {
  //       res.status(404).json({ message: "แก้ไขข้อมูลไม่สำเร็จ!" });
  //       return;
  //     }
  //     res.status(200).json({ message: "แก้ไขข้อมูลนิสิตสำเร็จ!" });
  //   } catch (error) {
  //     this.handleError("StudentsController.update", error, res);
  //   }
  // }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseStudentPayload(req.body); // ✅ object
      const created = await this.studentsService.addStudents(data);
      if (!created) {
        res.status(409).json({ message: "มีข้อมูลนิสิตนี้อยู่ในระบบแล้ว!" });
        return;
      }
      res.status(201).json({ message: "เพิ่มข้อมูลนิสิตสำเร็จ!" });
    } catch (error) {
      this.handleError("StudentsController.create", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.students_id);
      const data = this.parseStudentPayload(req.body); // ✅ object
      const updated = await this.studentsService.updatedStudents(id, data);
      if (!updated) {
        res.status(404).json({ message: "แก้ไขข้อมูลไม่สำเร็จ!" });
        return;
      }
      res.status(200).json({ message: "แก้ไขข้อมูลนิสิตสำเร็จ!" });
    } catch (error) {
      this.handleError("StudentsController.update", error, res);
    }
  }

  // public async delete(req: Request, res: Response): Promise<void> {
  //   try {
  //     const id = this.parseId(req.params.students_id);
  //     const deleted = await this.studentsService.deletedStudents(id);
  //     if (!deleted) {
  //       res.status(404).json({ message: "ไม่พบข้อมูลนิสิตที่ต้องการลบ!" });
  //       return;
  //     }
  //     res.status(200).json({ message: "ลบข้อมูลนิสิตสำเร็จ!" });
  //   } catch (error) {
  //     this.handleError("StudentsController.delete", error, res);
  //   }
  // }

  // students.controller.ts
  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.students_id);
      const result = await this.studentsService.deletedStudents(id);

      if (result === "soft") {
        res
          .status(200)
          .json({ message: "นิสิตถูกปิดใช้งาน (Soft Delete) เรียบร้อยแล้ว" });
      } else if (result === "hard") {
        res
          .status(200)
          .json({ message: "ลบข้อมูลนิสิตและผู้ใช้สำเร็จ (Hard Delete)" });
      } else {
        res.status(404).json({ message: "ไม่พบข้อมูลนิสิตที่ต้องการลบ!" });
      }
    } catch (error) {
      this.handleError("StudentsController.delete", error, res);
    }
  }

  private parseId(value: string): number {
    const id = parseInt(xss(value), 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  // private parseStudentPayload(body: any): any[] {
  //   return [
  //     this.parseId(body.users_id),
  //     xss(body.first_name),
  //     xss(body.last_name),
  //     xss(body.education_status),
  //     xss(body.email),
  //     this.parseOptionalInt(body.faculty_id),
  //     this.parseOptionalInt(body.department_id),
  //     this.parseOptionalInt(body.grade_id),
  //     this.parseOptionalInt(body.eventcoop_id),
  //   ];
  // }

  private parseStudentPayload(body: Students): {
    users_id: number;
    first_name: string;
    last_name: string;
    education_status: string;
    email: string;
    faculty_id?: number;
    department_id?: number;
    grade_id?: number;
    eventcoop_id?: number;
  } {
    return {
      users_id: body.users_id,
      first_name: xss(body.first_name ?? ""),
      last_name: xss(body.last_name ?? ""),
      education_status: xss(body.education_status ?? ""),
      email: xss(body.email ?? ""),
      faculty_id: body.faculty_id,
      department_id: body.department_id,
      grade_id: body.grade_id,
      eventcoop_id: body.eventcoop_id,
    };
  }

  private parseOptionalInt(
    value: any,
    fallback: number | null = null
  ): number | null {
    return !isNaN(Number(value)) ? parseInt(xss(value), 10) : fallback;
  }
}

const controller = new StudentsController();
export const studentsController = {
  count: controller.count.bind(controller),
  getAll: controller.getAll.bind(controller),
  getStudentsSuccess: controller.getStudentsSuccess.bind(controller),
  getPaginated: controller.getPaginated.bind(controller),
  create: controller.create.bind(controller),
  update: controller.update.bind(controller),
  delete: controller.delete.bind(controller),
};
