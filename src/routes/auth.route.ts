import { Router, Request } from "express";
import { wrapAsync } from "../utils/wrapAsync";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { AuthDao } from "../daos/auth.dao";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();
const authController = new AuthController(new AuthService(new AuthDao()));

interface JwtUser {
  users_id: number;
  roles_id: number;
}

router.post(
  "/login",
  wrapAsync(async (req, res) => {
    // ใช้ login method ใหม่ที่จัดการ response เอง
    await authController.login(req, res);
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
    await authController.getMe(req, res);
  })
);

// 🚀 PUT /api/auth/update-password → อัปเดตรหัสผ่านใหม่
router.put(
  "/update-password",
  verifyToken,
  wrapAsync(async (req, res) => {
    await authController.updatePassword(req, res);
  })
);

export default router;
