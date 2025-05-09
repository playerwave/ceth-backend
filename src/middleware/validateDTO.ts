import { validate } from "class-validator";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { plainToInstance } from "class-transformer";
import logger from "../utils/logger";

export const validateDTO = (DTOClass: any): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const dtoInstance = plainToInstance(DTOClass, req.body, {
      enableImplicitConversion: true,
    });

    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      const formattedErrors = errors.map((err) => ({
        field: err.property,
        messages: Object.values(err.constraints || {}),
      }));

      console.log("Error detect in dto:", formattedErrors);

      res.status(400).json({ errors: formattedErrors }); // ✅ แก้ไขการ return
      return; // ✅ ให้ middleware จบการทำงาน
    }

    next(); // ✅ เรียก `next()` เพื่อไป middleware ถัดไป
  };
};
