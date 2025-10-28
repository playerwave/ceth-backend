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

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseStudentPayload(req.body);
      
      // ถ้าไม่มี users_id แต่มี username/password ให้สร้าง user อัตโนมัติ
      if (!data.users_id && (data.username || data.password)) {
        const createdUser = await this.studentsService.createUserAndStudent({
          username: data.username || data.email, // ใช้ email เป็น username ถ้าไม่มี
          password: data.password || "123456", // default password
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          education_status: data.education_status || "Studying",
          faculty_id: data.faculty_id,
          department_id: data.department_id,
          grade_id: data.grade_id,
          eventcoop_id: data.eventcoop_id,
          soft_hours: data.soft_hours,
          hard_hours: data.hard_hours,
          risk_status: data.risk_status || "Normal",
        });
        
        if (!createdUser) {
          res.status(409).json({ message: "มีข้อมูลนิสิตนี้อยู่ในระบบแล้ว!" });
          return;
        }
        
        res.status(201).json({ 
          message: "เพิ่มข้อมูลนิสิตและผู้ใช้สำเร็จ!",
          user: createdUser
        });
        return;
      }
      
      // ถ้ามี users_id อยู่แล้ว ให้สร้าง student ตามปกติ
      if (!data.users_id) {
        res.status(400).json({ message: "ต้องระบุ users_id หรือ username/password!" });
        return;
      }
      
      const created = await this.studentsService.addStudents({
        users_id: data.users_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        education_status: data.education_status || "Studying",
        faculty_id: data.faculty_id || null,
        department_id: data.department_id || null,
        grade_id: data.grade_id || null,
        eventcoop_id: data.eventcoop_id || null,
        soft_hours: data.soft_hours || null,
        hard_hours: data.hard_hours || null,
        risk_status: data.risk_status || "Normal",
      });
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
      const data = this.parseStudentPayload(req.body);
      
      // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบหรือไม่
      if (!data.first_name || !data.last_name || !data.email || !data.education_status) {
        res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน!" });
        return;
      }
      
      const updated = await this.studentsService.updatedStudents(id, {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        education_status: data.education_status,
        faculty_id: data.faculty_id || undefined,
        department_id: data.department_id || undefined,
        grade_id: data.grade_id || undefined,
        eventcoop_id: data.eventcoop_id || undefined,
        soft_hours: data.soft_hours || undefined,
        hard_hours: data.hard_hours || undefined,
        risk_status: data.risk_status,
      });
      
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

  public async createStudentWithUser(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseStudentWithUserPayload(req.body);
      
      // สร้าง user ก่อน
      const createdUser = await this.studentsService.createUserAndStudent(data);
      
      if (!createdUser) {
        res.status(409).json({ message: "มีข้อมูลนิสิตนี้อยู่ในระบบแล้ว!" });
        return;
      }
      
      res.status(201).json({ 
        message: "เพิ่มข้อมูลนิสิตสำเร็จ!",
        user: createdUser
      });
    } catch (error) {
      this.handleError("StudentsController.createStudentWithUser", error, res);
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

  private parseStudentPayload(body: any): {
    users_id?: number;
    first_name: string;
    last_name: string;
    education_status?: string;
    email: string;
    faculty_id?: number | null;
    department_id?: number | null;
    grade_id?: number | null;
    eventcoop_id?: number | null;
    soft_hours?: number | null;
    hard_hours?: number | null;
    risk_status?: string;
    username?: string;
    password?: string;
  } {
    return {
      users_id: body.users_id,
      first_name: xss(body.first_name ?? ""),
      last_name: xss(body.last_name ?? ""),
      education_status: xss(body.education_status ?? "Studying"),
      email: xss(body.email ?? ""),
      faculty_id: this.parseOptionalInt(body.faculty_id),
      department_id: this.parseOptionalInt(body.department_id),
      grade_id: this.parseOptionalInt(body.grade_id),
      eventcoop_id: this.parseOptionalInt(body.eventcoop_id),
      soft_hours: this.parseOptionalInt(body.soft_hours),
      hard_hours: this.parseOptionalInt(body.hard_hours),
      risk_status: body.risk_status || "Normal",
      username: body.username,
      password: body.password,
    };
  }

  private parseOptionalInt(
    value: any,
    fallback: number | null = null
  ): number | null {
    return !isNaN(Number(value)) ? parseInt(xss(value), 10) : fallback;
  }

  private parseStudentWithUserPayload(body: any): {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    email: string;
    education_status: string;
    faculty_id?: number | null;
    department_id?: number | null;
    grade_id?: number | null;
    eventcoop_id?: number | null;
    soft_hours?: number | null;
    hard_hours?: number | null;
    risk_status?: string;
  } {
    return {
      username: xss(body.username ?? ""),
      password: xss(body.password ?? "123456"), // default password
      first_name: xss(body.first_name ?? ""),
      last_name: xss(body.last_name ?? ""),
      email: xss(body.email ?? ""),
      education_status: xss(body.education_status ?? "Studying"),
      faculty_id: this.parseOptionalInt(body.faculty_id),
      department_id: this.parseOptionalInt(body.department_id),
      grade_id: this.parseOptionalInt(body.grade_id),
      eventcoop_id: this.parseOptionalInt(body.eventcoop_id),
      soft_hours: this.parseOptionalInt(body.soft_hours),
      hard_hours: this.parseOptionalInt(body.hard_hours),
      risk_status: body.risk_status || "Normal",
    };
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
  createStudentWithUser: controller.createStudentWithUser.bind(controller),
};
