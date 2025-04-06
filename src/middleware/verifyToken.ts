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

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies.token;

  if (!token) {
    res
      .status(401)
      .json({ success: false, message: "Unauthorized: No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error("Error in verifyToken:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
