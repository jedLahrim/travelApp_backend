import { validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";
export const checkValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: errors.array().map((value) => {
        return { message: value.msg };
      }),
    });
  } else {
    next();
  }
};
