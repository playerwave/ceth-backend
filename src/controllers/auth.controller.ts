// src/controllers/users.controller.ts
import { Request, Response } from "express";
import xss from "xss";
import { AuthService } from "../services/auth.service";
import { ErrorHandledController } from "./error.handled.controller";
import { Users } from "../entity/users.entity";

export class AuthController extends ErrorHandledController {
  constructor(private readonly authService: AuthService = new AuthService()) {
    super();
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseUserPayload(req.body);
      const registered = await this.authService.register(
        data.username,
        data.password
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

  public async validateUser(
    username: string,
    password: string
  ): Promise<Users | null> {
    try {
      return await this.authService.validateUser(username, password);
    } catch (error) {
      // ถ้า error จริง ให้ throw ขึ้นไปให้ router จัดการ
      throw error;
    }
  }

  public async findById(userId: number): Promise<Users | null> {
    try {
      return await this.authService.findById(userId);
    } catch (error) {
      throw error;
    }
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

const controller = new AuthController();
export const authController = {
  register: controller.register.bind(controller),
  validateUser: controller.validateUser.bind(controller),
  findById: controller.findById.bind(controller),
};
