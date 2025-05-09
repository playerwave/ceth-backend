import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * ตรวจสอบ validation result หลังจาก express-validator ทำงาน
 * ถ้ามี error จะตอบกลับ 400 พร้อม error รายละเอียด
 *
 * หรือเอาง่ายๆก็คือ เป็น middleware ที่ใช้ตรวจสอบว่าข้อมูลที่ client ส่งมาว่าถูกต้องไหม
 */

export const requestValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
