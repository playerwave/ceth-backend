import { Request, Response, NextFunction, RequestHandler } from "express";

/*
/ ใช้ห่อ async controller เพื่อจับ error อัติโนมัติ
  ตามหลักการ DRY ที่พยายามไม่ใช้โค้ดที่ยาวๆซ้ำๆ
*/
export const wrapAsync = (
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
