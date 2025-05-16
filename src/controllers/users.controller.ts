import { UsersService } from "../services/users.service";
import { Request, Response } from "express";
import xss from "xss";

export class UsersController {
  private usersService = new UsersService();

  private sanitizeInput(input: any): string {
    return xss(input);
  }

  rolesAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
      const rolesAdmin = await this.usersService.rolesAdmin();
      return rolesAdmin
    } catch (error) {
      res.status(500).json(`Error fetching Users data : ${error}`);
    }
  };

  getUsers = async (req: Request, res: Response): Promise<any> => {
    try {
      const users = await this.usersService.getUsers();
      return users
    } catch (error) {
      res.status(500).json(`Error fetching Users data : ${error}`);
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    const usernameSanitize = this.sanitizeInput(username)
    const passwordSanitize = this.sanitizeInput(password)
    try {
      const register = await this.usersService.register(usernameSanitize, passwordSanitize);
      if (register) {
        res.status(200).json({ message: "ลงทะเบียนสำเร็จ !" });
      } else {
        res.status(409).json({ message: "มีผู้ใช้นี้แล้ว !" });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: `เกิดข้อผิดพลาด: ${error}` });
    }
  };




}
