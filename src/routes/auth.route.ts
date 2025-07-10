// import { Router } from "express";
// import passport from "passport";
// import rateLimit from "express-rate-limit";
// import jwt from "jsonwebtoken";

// import { AuthController } from "../controllers/auth.controller";
// import { AuthService } from "../services/auth.service";
// import { AuthDao } from "../daos/auth.dao";

// import { wrapAsync } from "../utils/wrapAsync";
// import { Users } from "../entity/users.entity";

// const router = Router();

// // 🧩 Instantiation
// const authDao = new AuthDao();
// const authService = new AuthService(authDao);
// const authController = new AuthController(authService);

// // 🌐 Extend Express types for session-based auth
// declare global {
//   namespace Express {
//     interface User extends Users {}
//     interface Request {
//       logIn(user: User, callback: (err: any) => void): void;
//       logOut(callback: (err: any) => void): void;
//       isAuthenticated(): boolean;
//     }
//   }
// }

// // 🚫 Rate limit login attempts
// const loginLimit = rateLimit({
//   windowMs: 1000 * 30,
//   max: 5,
//   message: "คุณเข้าสู่ระบบเกิน 5 ครั้ง กรุณาลองอีกครั้ง ใน 5 นาที",
//   headers: true,
// });

// // 🟢 POST: Login with JWT
// // router.post(
// //   "/login",
// //   loginLimit,
// //   wrapAsync(async (req, res, next) => {
// //     passport.authenticate(
// //       "local",
// //       (
// //         err: Error | null,
// //         user: Express.User | false,
// //         info: { message?: string }
// //       ) => {
// //         if (err) {
// //           return res.status(500).json({
// //             message: "เกิดข้อผิดพลาด",
// //             error: err.message,
// //           });
// //         }

// //         console.log(`✅ ผู้ใช้ ${user} login เข้าระบบ`);

// //         if (!user) {
// //           return res.status(401).json({
// //             message: info?.message || "เข้าสู่ระบบล้มเหลว !",
// //           });
// //         }

// //         req.logIn(user, (loginErr: Error | null) => {
// //           if (loginErr) {
// //             return res.status(500).json({
// //               message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
// //             });
// //           }

// //           const token = jwt.sign(
// //             {
// //               users_id: user.users_id,
// //               roles_id: user.roles_id,
// //             },
// //             process.env.JWT_SECRET || "secret",
// //             { expiresIn: "1h" }
// //           );

// //           const { password, ...safeUser } = user;

// //           return res.status(200).json({
// //             message: "เข้าสู่ระบบสำเร็จ !",
// //             token,
// //             user: safeUser,
// //           });
// //         });
// //       }
// //     )(req, res, next);
// //   })
// // );

// router.post(
//   "/login",
//   loginLimit,
//   wrapAsync(async (req, res, next) => {
//     passport.authenticate(
//       "local",
//       (
//         err: Error | null,
//         user: Express.User | false,
//         info: { message?: string }
//       ) => {
//         if (err) {
//           return res
//             .status(500)
//             .json({ message: "เกิดข้อผิดพลาด", error: err.message });
//         }
//         if (!user) {
//           return res
//             .status(401)
//             .json({ message: info?.message || "เข้าสู่ระบบล้มเหลว !" });
//         }

//         // ตอนนี้ user เป็น Express.User (alias ของ Users) อ่าน property ได้ตรง ๆ
//         console.log("✅ ผู้ใช้ login เข้าระบบ:", {
//           id: user.users_id,
//           name: `${user.username}`,
//           rolesId: user.roles_id,
//           roleName: user.roles?.roles_name,
//         });

//         req.logIn(user, (loginErr: Error | null) => {
//           if (loginErr) {
//             return res
//               .status(500)
//               .json({ message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
//           }

//           const token = jwt.sign(
//             { users_id: user.users_id, roles_id: user.roles_id },
//             process.env.JWT_SECRET ?? "secret",
//             { expiresIn: "1h" }
//           );

//           const { password, ...safeUser } = user;

//           return res.status(200).json({
//             message: "เข้าสู่ระบบสำเร็จ !",
//             token,
//             user: safeUser,
//           });
//         });
//       }
//     )(req, res, next);
//   })
// );

// router.delete("/logout", async (req, res) => {
//   await new Promise<void>((resolve, reject) => {
//     req.logOut((err) => (err ? reject(err) : resolve()));
//   });
//   res.status(200).json({ message: "Logout success" });
// });

// // 🟦 GET: Register Page (Mock page for frontend)
// router.get(
//   "/register",
//   wrapAsync(async (req, res) => {
//     res.status(200).json({ message: "Register Page" });
//   })
// );

// router.get(
//   "/me",
//   wrapAsync(async (req, res) => {
//     // ถ้ายังไม่ authenticated ให้ส่ง 401
//     if (!req.isAuthenticated()) {
//       return res.status(401).json({ message: "Not authenticated" });
//     }

//     // ดึงข้อมูลผู้ใช้จาก req.user (exclude password)
//     const { password, ...safeUser } = req.user as Users;
//     return res.status(200).json(safeUser);
//   })
// );

// // ✅ POST: Register
// router.post(
//   "/register",
//   wrapAsync(authController.register.bind(authController))
// );

// export default router;

import { Router } from "express";
import jwt from "jsonwebtoken";
import { wrapAsync } from "../utils/wrapAsync";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { AuthDao } from "../daos/auth.dao";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();
const authController = new AuthController(new AuthService(new AuthDao()));

interface AuthenticatedRequest extends Request {
  userId: number;
}

// 🚀 POST /api/auth/login → validate, sign JWT, set cookie
router.post(
  "/login",
  wrapAsync(async (req, res) => {
    const { username, password } = req.body;
    // 1. เช็ค Credentials (AuthController ควรมี method นี้)
    const user = await authController.validateUser(username, password);
    if (!user) {
      return res.status(401).json({ message: "Invalid username/password" });
    }

    // 2. สร้าง JWT (payload ตามต้องการ)
    const token = jwt.sign(
      { id: user.users_id, roles_id: user.roles_id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // 3. ส่ง HttpOnly cookie กลับ
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
        sameSite: "lax",
      })
      .status(200)
      .json({
        message: "เข้าสู่ระบบสำเร็จ",
        user: {
          users_id: user.users_id,
          username: user.username,
          roles_id: user.roles_id,
          // … field อื่นที่ต้องการส่งกลับ
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

// ➕ GET /api/auth/me → protected by verifyToken
// router.get(
//   "/me",
//   verifyToken,
//   wrapAsync(async (req: AuthenticatedRequest, res) => {
//     // req.userId ถูก set ใน verifyToken
//     const user = await authController.findById(req.userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     const { password, ...safeUser } = user;
//     res.status(200).json(safeUser);
//   })
// );
router.get(
  "/me",
  verifyToken,
  wrapAsync(async (req, res) => {
    // 👇 cast req เป็น AuthenticatedRequest เพื่อให้ใช้ userId ได้
    const { userId } = req as unknown as AuthenticatedRequest;

    const user = await authController.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...safeUser } = user;
    res.status(200).json(safeUser);
  })
);

export default router;
