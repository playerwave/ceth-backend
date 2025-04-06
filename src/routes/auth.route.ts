import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { verifyToken, AuthRequest } from "../middleware/verifyToken";

const router = Router();

router.get("/check-auth", verifyToken, async (req, res, next) => {
  try {
    await authController.checkAuth(req as AuthRequest, res);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    await authController.login(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete("/logout", verifyToken, async (req, res, next) => {
  try {
    await authController.logout(req as AuthRequest, res);
  } catch (error) {
    next(error);
  }
});


export default router;
