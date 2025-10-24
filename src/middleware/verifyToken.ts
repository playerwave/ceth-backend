// src/middleware/verifyToken.ts
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";

export const verifyToken: RequestHandler = (req, res, next) => {
  // ✅ Debug logging
  console.log("🔍 [verifyToken] Starting token verification...");
  console.log("🍪 [verifyToken] Cookies:", req.cookies);
  console.log("🔑 [verifyToken] Authorization header:", req.headers.authorization);
  console.log("🌍 [verifyToken] NODE_ENV:", process.env.NODE_ENV);
  console.log("📡 [verifyToken] Request URL:", req.url);
  console.log("📡 [verifyToken] Request method:", req.method);

  // ตรวจสอบ token จาก cookies หรือ Authorization header
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

  console.log("🎫 [verifyToken] Extracted token:", token ? "Token exists" : "No token found");

  if (!token) {
    console.log("❌ [verifyToken] No token provided");
    res.status(401).json({ message: "No token provided" });
    logger.error("No token provided in request");
    return;
  }

  try {
    console.log("🔐 [verifyToken] Verifying token...");
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      roles_id: number;
      iat: number;
      exp: number;
    };

    console.log("✅ [verifyToken] Token verified successfully");
    console.log("👤 [verifyToken] User ID:", payload.id);
    console.log("🎭 [verifyToken] Role ID:", payload.roles_id);

    // ✨ เพิ่มตรงนี้ → inject userId เข้า req
    // (req as any).userId = payload.id;

    (req as any).user = {
      id: payload.id,        // ✅ เปลี่ยนจาก users_id เป็น id
      roles_id: payload.roles_id,
    };

    console.log("✅ [verifyToken] User object set in request");
    next();
  } catch (err) {
    console.log("❌ [verifyToken] Token verification failed:", err);
    
    // res.status(401).json({ message: "Invalid or expired token" });
    // return;
    if (err instanceof jwt.TokenExpiredError) {
      console.log("⏰ [verifyToken] Token expired");
      res.status(401).json({ message: "Token expired" });
    } else if (err instanceof jwt.JsonWebTokenError) {
      console.log("🚫 [verifyToken] Malformed or invalid token");
      res.status(401).json({ message: "Malformed or invalid token" });
    } else {
      console.log("🚫 [verifyToken] Unauthorized access");
      res.status(401).json({ message: "Unauthorized access" });
    }
    return;
  }
};
