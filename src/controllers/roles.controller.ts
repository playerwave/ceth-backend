// src/controllers/Admin/role.controller.ts
import { Request, Response } from "express";
import { RolesService } from "../services/roles.service";
import { ErrorHandledController } from "./error.handled.controller";
import xss from "xss";

export class RolesController extends ErrorHandledController {
  constructor(
    private readonly rolesService: RolesService = new RolesService()
  ) {
    super();
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.rolesService.countRoles();
      res.status(200).json({ count });
    } catch (error) {
      this.handleError("RolesController.count", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const roles = await this.rolesService.getRoles();
      res.status(200).json(roles);
    } catch (error) {
      this.handleError("RolesController.getAll", error, res);
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseRolePayload(req.body);
      const created = await this.rolesService.addRoles(data.roles_name);

      if (created) {
        res.status(201).json({ message: "เพิ่มชื่อบทบาทสำเร็จ !" });
      } else {
        res.status(409).json({ message: "มีชื่อบทบาทนี้อยู่ในระบบแล้ว !" });
      }
    } catch (error) {
      this.handleError("RolesController.create", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.roles_id);
      const data = this.parseRolePayload(req.body);

      const updated = await this.rolesService.updatedRolesByName(
        id,
        data.roles_name
      );

      if (updated) {
        res.status(200).json({ message: "แก้ไขชื่อบทบาทสำเร็จ !" });
      } else {
        res.status(409).json({ message: "มีชื่อบทบาทนี้อยู่ในระบบแล้ว !" });
      }
    } catch (error) {
      this.handleError("RolesController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.roles_id);
      const deleted = await this.rolesService.deletedRoles(id);

      if (deleted) {
        res.status(200).json({ message: "ลบชื่อบทบาทสำเร็จ !" });
      } else {
        res.status(404).json({ message: "ไม่พบข้อมูลบทบาทที่ต้องการลบ !" });
      }
    } catch (error) {
      this.handleError("RolesController.delete", error, res);
    }
  }

  public async resetAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.rolesService.resetAllRoles();
      
      if (result.success) {
        res.status(200).json({ 
          message: "ลบบทบาททั้งหมดและ reset ID สำเร็จ !",
          deletedCount: result.deletedCount
        });
      } else {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการ reset บทบาท !" });
      }
    } catch (error) {
      this.handleError("RolesController.resetAll", error, res);
    }
  }

  private parseId(value: string): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private parseRolePayload(body: any): { roles_name: string } {
    return {
      roles_name: xss(body.roles_name ?? ""),
    };
  }
}

const rolesService = new RolesService();
const controller = new RolesController(rolesService);

export const rolesController = {
  count: controller.count.bind(controller),
  getAll: controller.getAll.bind(controller),
  create: controller.create.bind(controller),
  update: controller.update.bind(controller),
  delete: controller.delete.bind(controller),
  resetAll: controller.resetAll.bind(controller),
};
