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

export const verifyToken: RequestHandler = (req, res, next) => {
  const token = req.cookies.token as string | undefined;

  if (!token) {
    res.status(401).json({ message: "No token provided" });
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
    (req as any).userId = payload.id;

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
};
