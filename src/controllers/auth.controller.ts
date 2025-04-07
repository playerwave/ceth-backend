import { Request, Response } from "express";
import AuthService from "../services/auth.service";
import { AuthRequest } from "../middleware/verifyToken";
import logger from "../middleware/logger";

export default class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      console.log("login controller: ", email);
      const result = await this.authService.login({ email }, res);
      res.status(200).json({ user: result }); // ✅ ส่ง user กลับไปใน key "user"
    } catch (error) {
      logger.error("❌ Error in login (AuthController)", { error });
      res.status(400).json({ message: (error as Error).message });
    }
  };

  checkAuth = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.checkAuth(req);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ message: (error as Error).message });
    }
  };

  // logout = (_req: Request, res: Response): void => {
  //   this.authService.logout(res);
  //   res.status(200).json({ message: "Logged out successfully" });
  // };

  logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.authService.logout(req, res); // ส่ง req ด้วย
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      logger.error("❌ Error in logout (AuthController)", { error });
      res.status(500).json({ message: "Logout failed", error });
    }
  };
}

const authService = new AuthService();
export const authController = new AuthController(authService);
