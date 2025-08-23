// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";

// export interface AuthRequest extends Request {
//   userId?: string;
// }

// export const verifyToken = (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const token = req.cookies.token;

//   if (!token) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Unauthorized: No token provided" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
//       id: string;
//     };
//     req.userId = decoded.id;
//     next();
//   } catch (error) {
//     console.error("Error in verifyToken:", error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// src/middleware/verifyToken.ts
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";

export const verifyToken: RequestHandler = (req, res, next) => {
  // ตรวจสอบ token จาก cookies หรือ Authorization header
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    logger.error("No token provided in request");
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      roles_id: number;
      iat: number;
      exp: number;
    };

    // ✨ เพิ่มตรงนี้ → inject userId เข้า req
    // (req as any).userId = payload.id;

    (req as any).user = {
      users_id: payload.id,
      roles_id: payload.roles_id,
    };

    next();
  } catch (err) {
    // res.status(401).json({ message: "Invalid or expired token" });
    // return;
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Malformed or invalid token" });
    } else {
      res.status(401).json({ message: "Unauthorized access" });
    }
    return;
  }
};
