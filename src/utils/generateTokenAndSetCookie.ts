import jwt from "jsonwebtoken";
import { Response } from "express";

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

  res.cookie("token", token, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === "production",
    secure: true,
    // sameSite: "strict",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  console.log(token);
  return token;
};
