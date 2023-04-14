import process from "process";
import * as jwt from "jsonwebtoken";
import { NextFunction } from "express";
import { AppError } from "../commons/errors/app-error";
import { Unauthorized } from "../commons/errors/errors-codes";

export async function authGuard(req, res, next: NextFunction) {
  const bearerHeader = req.headers["authorization"];
  if (!bearerHeader) {
    return res.status(401).json(new AppError(Unauthorized));
  }
  const bearer = bearerHeader.split(" ");
  const bearerToken = bearer[1];
  try {
    const secretKey = process.env.SECRET_KEY;
    const decoded: any = jwt.verify(bearerToken, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(new AppError(Unauthorized));
  }
}
