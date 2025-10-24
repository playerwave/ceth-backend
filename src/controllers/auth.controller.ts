// src/controllers/users.controller.ts
import { Request, Response } from "express";
import xss from "xss";
import { AuthService } from "../services/auth.service";
import { ErrorHandledController } from "./error.handled.controller";
import { Users } from "../entity/users.entity";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie";

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

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({
          message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
        });
        return;
      }

      const user = await this.authService.validateUser(username, password);

      if (!user) {
        res.status(401).json({
          message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        });
        return;
      }

      // ถ้าเป็น Student ให้ดึงข้อมูล Student เพิ่มเติม
      if (user.roles.roles_name === "Student") {
        const studentData = await this.authService.getStudentData(
          user.users_id
        );

        if (studentData) {
          const responseBody = {
            message: "เข้าสู่ระบบสำเร็จ",
            user: {
              users_id: user.users_id,
              username: user.username,
              roles_id: user.roles_id,
              roles: {
                roles_id: user.roles.roles_id,
                roles_name: user.roles.roles_name,
              },
              student: studentData,
            },
          };

          // สร้าง token ก่อน
          const token = generateTokenAndSetCookie(res, user.users_id, user.roles_id);
          res.status(200).json({ ...responseBody, token });
          return;
        }
      }

      // ถ้าเป็น Teacher ให้ดึงข้อมูล Teacher เพิ่มเติม
      if (user.roles.roles_name === "Teacher") {
        const teacherData = await this.authService.getTeacherData(
          user.users_id
        );

        if (teacherData) {
          const responseBody = {
            message: "เข้าสู่ระบบสำเร็จ",
            user: {
              users_id: user.users_id,
              username: user.username,
              roles_id: user.roles_id,
              roles: {
                roles_id: user.roles.roles_id,
                roles_name: user.roles.roles_name,
              },
              teacher: teacherData,
            },
          };

          // สร้าง token ก่อน
          const token = generateTokenAndSetCookie(res, user.users_id, user.roles_id);
          res.status(200).json({ ...responseBody, token });
          return;
        }
      }

      // สำหรับ role อื่นๆ
      const responseBody = {
        message: "เข้าสู่ระบบสำเร็จ",
        user: {
          users_id: user.users_id,
          username: user.username,
          roles_id: user.roles_id,
          roles: {
            roles_id: user.roles.roles_id,
            roles_name: user.roles.roles_name,
          },
        },
      };

      // สร้าง token ก่อน
      const token = generateTokenAndSetCookie(res, user.users_id);
      res.status(200).json({ ...responseBody, token });
    } catch (error) {
      this.handleError("AuthController.login", error, res);
    }
  }

  public async findById(userId: number): Promise<Users | null> {
    try {
      return await this.authService.findById(userId);
    } catch (error) {
      throw error;
    }
  }

  public async getMe(req: Request, res: Response): Promise<void> {
    try {
      // ✅ Debug logging
      console.log("🔍 [getMe] Starting getMe request...");
      console.log("🍪 [getMe] Cookies:", req.cookies);
      console.log("🔑 [getMe] Authorization header:", req.headers.authorization);
      console.log("👤 [getMe] User from token:", req.user);
      console.log("🌍 [getMe] NODE_ENV:", process.env.NODE_ENV);

      const user = req.user;
      
      if (!user) {
        console.log("❌ [getMe] No user found in request");
        res.status(401).json({ message: "User not authenticated" });
        return;
      }

      console.log("✅ [getMe] User found:", user);
      const result = await this.authService.findById(user.users_id);

      if (!result) {
        console.log("❌ [getMe] User not found in database");
        res.status(404).json({ message: "User not found" });
        return;
      }

      console.log("✅ [getMe] User data retrieved from database");
      const { password, ...safeUser } = result;

      // ถ้าเป็น Student ให้ดึงข้อมูล Student เพิ่มเติม
      if (result.roles.roles_name === "Student") {
        console.log("👨‍🎓 [getMe] Fetching student data...");
        const studentData = await this.authService.getStudentData(
          user.users_id
        );

        if (studentData) {
          console.log("✅ [getMe] Student data retrieved");
          res.setHeader("Cache-Control", "no-store");
          res.status(200).json({
            ...safeUser,
            student: studentData,
          });
          return;
        }
      }

      // ถ้าเป็น Teacher ให้ดึงข้อมูล Teacher เพิ่มเติม
      if (result.roles.roles_name === "Teacher") {
        console.log("👨‍🏫 [getMe] Fetching teacher data...");
        const teacherData = await this.authService.getTeacherData(
          user.users_id
        );

        if (teacherData) {
          console.log("✅ [getMe] Teacher data retrieved");
          res.setHeader("Cache-Control", "no-store");
          res.status(200).json({
            ...safeUser,
            teacher: teacherData,
          });
          return;
        }
      }

      // สำหรับ role อื่นๆ
      console.log("✅ [getMe] Returning basic user data");
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(safeUser);
    } catch (error) {
      console.log("❌ [getMe] Error occurred:", error);
      this.handleError("AuthController.getMe", error, res);
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
  login: controller.login.bind(controller),
  getMe: controller.getMe.bind(controller),
};
