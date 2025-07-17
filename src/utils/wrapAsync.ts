// import { Request, Response, NextFunction, RequestHandler } from "express";

// /*
// / ใช้ห่อ async controller เพื่อจับ error อัติโนมัติ
//   ตามหลักการ DRY ที่พยายามไม่ใช้โค้ดที่ยาวๆซ้ำๆ
// */
// export const wrapAsync = (
//   fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>
// ): RequestHandler => {
//   return (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch(next);
//   };
// };

// utils/wrapAsync.ts
import { Request, Response, NextFunction, RequestHandler } from "express";

export const wrapAsync = <Req extends Request = Request>(
  fn: (req: Req, res: Response, next?: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
};
