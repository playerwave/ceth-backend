import { Router, Request, Response } from "express";
import { UserController } from "../../controllers/TestCloud/user.controller";

const router = Router();
const userController = new UserController();

// Route สำหรับแสดงฟอร์มการสมัคร
// router.get("/register", (req: Request, res: Response) => {
//   res.render("register.ejs");
// });

// // Route สำหรับรับข้อมูลการสมัคร
// router.post("/register", async (req: Request, res: Response) => {
//   await userController.registerUsers(req, res);
// });

router.get("/", async (req: Request, res: Response) => {
  await userController.getUsers(req, res);
});

export default router;
