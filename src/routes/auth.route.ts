import { Router, Request } from "express";
import { wrapAsync } from "../utils/wrapAsync";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { AuthDao } from "../daos/auth.dao";
import { verifyToken } from "../middleware/verifyToken";
import { Admin } from "../middleware/CheckRole";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

const router = Router();
const authController = new AuthController(new AuthService(new AuthDao()));

// interface AuthenticatedRequest
//   extends Request<
//     ParamsDictionary,
//     unknown, // response body → ถ้าไม่ใช้ response body โดยตรง
//     { username: string; password: string }, // request body → ตามที่คุณใช้ใน login
//     ParsedQs // query params → default ของ Express
//   > {
//   userId: number;
// }

interface JwtUser {
  users_id: number;
  roles_id: number;
}

router.post(
  "/login",
  wrapAsync(async (req, res) => {
    const { username, password } = req.body;
    const user = await authController.validateUser(username, password);
    if (!user) {
      return res.status(401).json({ message: "Invalid username/password" });
    }

    const token = generateTokenAndSetCookie(res, user.users_id); // ใช้ฟังก์ชันที่สร้างไว้

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        users_id: user.users_id,
        username: user.username,
        roles_id: user.roles_id,
        role_name: user.roles.roles_name,
      },
    });
  })
);

// 🚀 POST /api/auth/logout → ลบ cookie
router.post("/logout", (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .status(200)
    .json({ message: "Logout success" });
});

// router.get(
//   "/me",
//   verifyToken,
//   // Admin,
//   wrapAsync<AuthenticatedRequest>(async (req, res) => {
//     // const user = await authController.findById(req.userId);
//     const user = await authController.findById(req.user.users_id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     const { password, ...safeUser } = user;
//     res.status(200).json(safeUser);
//   })
// );

// router.get(
//   "/me",
//   verifyToken,
//   wrapAsync(async (req, res) => {
//     const user = req.user as JwtUser; // ✅ safe cast
//     const result = await authController.findById(user.users_id);
//     if (!result) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const { password, ...safeUser } = result;
//     res.status(200).json(safeUser);
//   })
// );

router.get(
  "/me",
  verifyToken,
  wrapAsync(async (req, res) => {
    const user = req.user as JwtUser;
    const result = await authController.findById(user.users_id);
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...safeUser } = result;

    res.setHeader("Cache-Control", "no-store"); // ✅ ปิด cache
    res.status(200).json(safeUser); // ✅ จะได้ response.body เสมอ
  })
);

export default router;
