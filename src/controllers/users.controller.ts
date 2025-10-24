// src/controllers/users.controller.ts
import { Request, Response } from "express";
import xss from "xss";
import { UsersService } from "../services/user.service";
import { ErrorHandledController } from "./error.handled.controller";
import { Roles } from "../entity/roles.entity";
import { get } from "http";

export class UsersController extends ErrorHandledController {
  constructor(
    private readonly usersService: UsersService = new UsersService()
  ) {
    super();
  }

  public async rolesAdmin(): Promise<Roles[]> {
    return await this.usersService.rolesAdmin();
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.usersService.countUsers();
      res.status(200).json({ count });
    } catch (error) {
      this.handleError("UsersController.count", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      // ลบ pagination ออก - ดึงทั้งหมด
      const users = await this.usersService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      this.handleError("UsersController.getAll", error, res);
    }
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.users_id);
      const user = await this.usersService.getUsersById(id);

      if (!user || user.length === 0) {
        res.status(404).json({ message: "ไม่พบผู้ใช้นี้ในระบบ!" });
        return;
      }

      const safeUser = { ...user[0] };
      if ("password" in safeUser) delete safeUser.password;

      res.status(200).json({ user: safeUser });
    } catch (error) {
      this.handleError("UsersController.getUser", error, res);
    }
  }

  // ✅ เพิ่ม getUserById method
  public async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const user = await this.usersService.getUsersById(id);

      if (!user || user.length === 0) {
        res.status(404).json({ message: "ไม่พบผู้ใช้นี้ในระบบ!" });
        return;
      }

      const safeUser = { ...user[0] };
      if ("password" in safeUser) delete safeUser.password;

      res.status(200).json({ user: safeUser });
    } catch (error) {
      this.handleError("UsersController.getUserById", error, res);
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseUserPayload(req.body);
      const createdUser = await this.usersService.addUsers(
        data.username,
        data.password,
        data.roles_id
      );

      if (!createdUser) {
        res.status(409).json({ message: "มีชื่อผู้ใช้นี้อยู่ในระบบแล้ว!" });
        return;
      }

      res.status(201).json({
        message: "เพิ่มผู้ใช้สำเร็จ!",
        user: createdUser,
      });
    } catch (error) {
      this.handleError("UsersController.create", error, res);
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseUserPayload(req.body);
      const registered = await this.usersService.register(
        data.username,
        data.password,
        data.roles_id
      );

      if (!registered) {
        res.status(409).json({ message: "มีผู้ใช้นี้แล้ว!" });
        return;
      }

      res.status(201).json({ message: "ลงทะเบียนสำเร็จ!" });
    } catch (error) {
      this.handleError("UsersController.register", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.users_id);
      const data = this.parseUserPayload(req.body);

      // ตรวจสอบว่ามี password ใน request หรือไม่
      if (data.password) {
        // ถ้ามี password ให้ update ทั้ง username, password, และ roles_id
        const updatedUser = await this.usersService.updatedUsersWithPassword(
          id,
          data.username,
          data.password,
          data.roles_id
        );

        if (!updatedUser) {
          res.status(404).json({ message: "ไม่พบผู้ใช้หรือมีชื่อซ้ำในระบบ!" });
          return;
        }

        res.status(200).json({
          message: "แก้ไขข้อมูลผู้ใช้สำเร็จ!",
          user: updatedUser,
        });
      } else {
        // ถ้าไม่มี password ให้ update เฉพาะ username และ roles_id
        const updatedUser = await this.usersService.updatedUsers(
          id,
          data.username,
          data.roles_id
        );

        if (!updatedUser) {
          res.status(404).json({ message: "ไม่พบผู้ใช้หรือมีชื่อซ้ำในระบบ!" });
          return;
        }

        res.status(200).json({
          message: "แก้ชื่อผู้ใช้สำเร็จ!",
          user: updatedUser,
        });
      }
    } catch (error) {
      this.handleError("UsersController.update", error, res);
    }
  }

  public async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.users_id);
      const password = xss(req.body.password);
      const confirmPassword = xss(req.body.confirmPassword);

      const updated = await this.usersService.updatedPasswordByUsers(
        id,
        password,
        confirmPassword
      );

      if (!updated) {
        res.status(400).json({ message: "ไม่สามารถเปลี่ยนรหัสผ่านได้!" });
        return;
      }

      res.status(200).json({ message: "แก้ไขรหัสผ่านผู้ใช้สำเร็จ!" });
    } catch (error) {
      this.handleError("UsersController.updatePassword", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.users_id);
      const deleted = await this.usersService.deletedUsers(id);

      if (!deleted) {
        res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้ที่ต้องการลบ!" });
        return;
      }

      res.status(200).json({ message: "ลบผู้ใช้สำเร็จ!" });
    } catch (error) {
      this.handleError("UsersController.delete", error, res);
    }
  }

  public async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await this.usersService.rolesAdmin();
      res.status(200).json(roles);
    } catch (error) {
      this.handleError("UsersController.getRoles", error, res);
    }
  }

  private parseId(value: string): number {
    const id = parseInt(xss(value), 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private parseUserPayload(body: any): {
    username: string;
    password: string;
    roles_id: number;
  } {
    return {
      username: xss(body.username),
      password: xss(body.password),
      roles_id: parseInt(xss(body.roles_id), 10),
    };
  }
}

const controller = new UsersController();
export const usersController = {
  count: controller.count.bind(controller),
  getAll: controller.getAll.bind(controller),
  getOne: controller.getOne.bind(controller),
  getUserById: controller.getUserById.bind(controller), // ✅ เพิ่ม getUserById
  create: controller.create.bind(controller),
  register: controller.register.bind(controller),
  update: controller.update.bind(controller),
  updatePassword: controller.updatePassword.bind(controller),
  delete: controller.delete.bind(controller),
  getRoles: controller.getRoles.bind(controller),
  rolesAdmin: controller.getRoles.bind(controller),
};
