// ✅ auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Response, Request } from "express";
import { AuthDao } from "../daos/auth.dao";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie";
import logger from "../middleware/logger";
import { AuthRequest } from "../middleware/verifyToken";


export default class AuthService {
  private authDao = new AuthDao();

  async login({ email }: { email: string }, res: Response) {
    console.log("login service: ", email);
    try {
      console.log("attemp login service");

      const user = await this.authDao.findUserByEmail(email);
      if (!user) {
        logger.warn("❌ Invalid credentials - user not found", { email });
        throw new Error("Invalid credentials");
      }

      generateTokenAndSetCookie(res, user.u_id);
      logger.info("✅ Login successful", { userId: user.u_id });

      return { ...user, password: undefined };
    } catch (error) {
      logger.error("❌ Error in login(AuthService)", error);
      throw error;
    }
  }

  async checkAuth(req: Request) {
    try {
      const token = req.cookies.token;
      if (!token) {
        logger.warn("❌ No token provided in checkAuth");
        throw new Error("Unauthorized");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
      };

      const user = await this.authDao.findUserById(decoded.id);
      if (!user) {
        logger.warn("❌ User not found in checkAuth", { userId: decoded.id });
        throw new Error("User not found");
      }

      logger.info("✅ Authenticated successfully", { userId: decoded.id });
      return user;
    } catch (error) {
      logger.error("❌ Error in checkAuth(AuthService)", error);
      throw error;
    }
  }

  // async logout(res: Response): Promise<void> {
  //   res.clearCookie("token");
  //   await this.authDao.logout(); // ✅ แค่เรียกเฉย ๆ ไม่มี last_logout
  // }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) {
      throw new Error("Unauthorized: No user id in request");
    }
  
    res.clearCookie("token");
    await this.authDao.logout(Number(userId)); // ส่ง userId เข้า DAO
  }
  
}
