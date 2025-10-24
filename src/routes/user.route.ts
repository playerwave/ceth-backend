import { Router, NextFunction } from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

import { UsersController } from "../controllers/users.controller";
import { UsersService } from "../services/user.service";
import { UsersDao } from "../daos/users.dao";
import { RolesController } from "../controllers/roles.controller";
import { RolesService } from "../services/roles.service";

import { wrapAsync } from "../utils/wrapAsync";
import { verifyToken } from "../middleware/verifyToken";
import { Users } from "../entity/users.entity";

const router = Router();

// 🧩 Instantiation
const usersDao = new UsersDao();
const usersService = new UsersService();
const usersController = new UsersController(usersService);

const rolesService = new RolesService();
const rolesController = new RolesController(rolesService);

// 🌐 Extend Express types for session-based auth
declare global {
  namespace Express {
    interface User extends Users {}
    interface Request {
      logIn(user: User, callback: (err: any) => void): void;
      logOut(callback: (err: any) => void): void;
      isAuthenticated(): boolean;
    }
  }
}

// 🚫 Rate limit login attempts
const loginLimit = rateLimit({
  windowMs: 1000 * 30,
  max: 5,
  message: "คุณเข้าสู่ระบบเกิน 5 ครั้ง กรุณาลองอีกครั้ง ใน 5 นาที",
  headers: true,
});

// 🟢 POST: Login with JWT
router.post(
  "/login",
  loginLimit,
  wrapAsync(async (req, res, next) => {
    passport.authenticate(
      "local",
      (
        err: Error | null,
        user: Express.User | false,
        info: { message?: string }
      ) => {
        if (err) {
          return res.status(500).json({
            message: "เกิดข้อผิดพลาด",
            error: err.message,
          });
        }

        if (!user) {
          return res.status(401).json({
            message: info?.message || "เข้าสู่ระบบล้มเหลว !",
          });
        }

        req.logIn(user, (loginErr: Error | null) => {
          if (loginErr) {
            return res.status(500).json({
              message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
            });
          }

          const token = jwt.sign(
            {
              id: user.users_id,        // ✅ เปลี่ยนจาก users_id เป็น id
              roles_id: user.roles_id,
            },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "1h" }
          );

          const { password, ...safeUser } = user;

          return res.status(200).json({
            message: "เข้าสู่ระบบสำเร็จ !",
            token,
            user: safeUser,
          });
        });
      }
    )(req, res, next);
  })
);

router.delete("/logout", async (req, res) => {
  await new Promise<void>((resolve, reject) => {
    req.logOut((err) => (err ? reject(err) : resolve()));
  });
  res.status(200).json({ message: "Logout success" });
});

// 🟦 GET: Register Page (Mock page for frontend)
router.get(
  "/register",
  wrapAsync(async (req, res) => {
    res.status(200).json({ message: "Register Page" });
  })
);

// ✅ POST: Register
router.post(
  "/register",
  wrapAsync(usersController.register.bind(usersController))
);

// 🔐 GET: Users (Admin-only)
router.get(
  "/get-users",
  wrapAsync(usersController.getAll.bind(usersController))
);

// ✅ GET: Get user by ID
router.get(
  "/get-user/:id",
  verifyToken,
  wrapAsync(usersController.getUserById.bind(usersController))
);

// 🎭 GET: Roles
router.get(
  "/get-roles",
  verifyToken,
  wrapAsync(rolesController.getAll.bind(rolesController))
);

// ➕ POST: Create user
router.post(
  "/create-user",
  verifyToken,
  wrapAsync(usersController.create.bind(usersController))
);

// ✏️ PUT: Update user info
router.put(
  "/update-user/:users_id",
  verifyToken,
  wrapAsync(usersController.update.bind(usersController))
);

// 🔑 PUT: Change password
router.put(
  "/update-password/:users_id",
  verifyToken,
  wrapAsync(usersController.updatePassword.bind(usersController))
);

// ❌ DELETE: Remove user
router.delete(
  "/delete-user/:users_id",
  verifyToken,
  wrapAsync(usersController.delete.bind(usersController))
);

export default router;
