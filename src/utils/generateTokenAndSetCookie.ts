import jwt from "jsonwebtoken";
import { Response } from "express";
import { getCookieConfig } from "../config/cookie.config";

export const generateTokenAndSetCookie = (
  res: Response,
  userId: number,
  rolesId?: number
): string => {
  const token = jwt.sign(
    { id: userId, roles_id: rolesId }, 
    process.env.JWT_SECRET as string, 
    {
      expiresIn: "7d",
    }
  );

  // ✅ Debug logging
  console.log("🔐 Generating token for user:", userId);
  console.log("🌍 NODE_ENV:", process.env.NODE_ENV);

  const cookieOptions = getCookieConfig();

  // ✅ Debug cookie options
  console.log("🍪 Cookie options:", cookieOptions);

  res.cookie("token", token, cookieOptions);

  console.log("✅ Token generated and cookie set");
  return token;
};
