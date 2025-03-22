import { Request, Response } from "express";
import { UserService } from "../../services/TestCloud/user.service";

export class UserController {
  private userService = new UserService();

  // ฟังก์ชันสำหรับแสดงรายชื่อผู้ใช้
  getUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.getUsers();
      return res.render("index.ejs", {
        user: users,
      });
    } catch (error) {
      res.status(500).send("Error to Response");
    }
  };

  // ฟังก์ชันสำหรับลงทะเบียนผู้ใช้
  //   registerUsers = async (req: Request, res: Response) => {
  //     const { email, password } = req.body;

  //     if (!email || !password) {
  //       res.status(400).send("You sent an invalid request.");
  //       return;
  //     }

  //     try {
  //       const result = await this.userService.registerUsers(email, password);
  //       if (result) {
  //         // หากสมัครสำเร็จให้ไปที่หน้า users
  //         res.status(200).redirect("/api/users");
  //       }
  //     } catch (error) {
  //       console.error(error);
  //       res.status(500).send("An error occurred during registration.");
  //     }
  //   };
}
