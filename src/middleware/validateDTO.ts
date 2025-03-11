import { validate } from "class-validator";
import { Request, Response, NextFunction, RequestHandler } from "express";

export const validateDTO = (DTOClass: any): RequestHandler => {
  return async (req, res, next) => {
    const dtoInstance = Object.assign(new DTOClass(), req.body);
    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      res.status(400).json({ error: "Invalid input", details: errors });
      return;
    }

    next();
  };
};
