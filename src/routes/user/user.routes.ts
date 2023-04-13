import express from "express";
import { body } from "express-validator";
import { Request, Response } from "express";
import sha256 from "sha256";
import * as jwt from "jsonwebtoken";
import { checkValidationErrors } from "../../validation/validation.errors";
import { User } from "../../entities/user.entity";
import {
  EMAIL_OR_PASSWORD_IS_INCORRECT,
  ERR_EMAIL_ALREADY_EXIST,
  ERR_NOT_FOUND_USER,
} from "../../commons/errors/errors-codes";
import { AppError } from "../../commons/errors/app-error";
import { authGuard } from "../../jwt/jwt.strategy";
import { GetUser } from "../../decorator/get-user.decorator";
import { Error } from "../../types/types";
const router = express.Router();
router.post(
  "/api/register",
  body("fullName").isString().withMessage("firstName must be string"),
  body("password")
    .isString()
    .isStrongPassword({
      minUppercase: 1,
      minLength: 6,
      returnScore: false,
      pointsPerUnique: 0,
      minSymbols: 0,
      minNumbers: 0,
    })
    .withMessage("password must be a strong password"),
  body("email").isEmail().withMessage("email must be an email"),
  checkValidationErrors,
  async (req: Request, res: Response) => {
    const { email, fullName, password } = req.body;
    const hashedPassword = sha256(password);
    try {
      const user = User.create({
        email,
        fullName: fullName,
        password: hashedPassword,
      });
      await User.save(user);
      res.json();
    } catch (e: Error) {
      if (e.code == "23505") {
        res.json(new AppError(ERR_EMAIL_ALREADY_EXIST));
      }
    }
  }
);
router.post(
  "/api/login",
  body("password").isString().withMessage("last_name must be string"),
  body("email").isEmail().withMessage("email must be an email"),
  checkValidationErrors,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await User.findOne({
      where: { email },
    });
    const hashedPassword = sha256(password);
    if (!user) {
      res.json(new AppError(ERR_NOT_FOUND_USER));
    } else {
      if (user && hashedPassword == user.password) {
        res.json(_getUserWithTokens(user));
      } else {
        res.json(new AppError(EMAIL_OR_PASSWORD_IS_INCORRECT));
      }
    }
  }
);
router.get("/api/user", authGuard, async (req: any, res) => {
  const user = await GetUser(req);
  res.json(_getUserWithTokens(user));
});
export { router as userRoute };
//
function _getUserWithTokens(user: User) {
  const payload = { user: user.email };
  const accessExpireIn = 864000000;
  const accessToken = generateToken(payload, accessExpireIn);
  const accessExpireAt = new Date(new Date().getTime() + accessExpireIn);

  const refreshExpireIn = 172800000;
  const refresh = generateToken(payload, refreshExpireIn);
  const refreshExpireAt = new Date(new Date().getTime() + refreshExpireIn);

  user.access = accessToken;
  user.accessExpireAt = accessExpireAt;
  user.refresh = refresh;
  user.refreshExpireAt = refreshExpireAt;
  return user;
}
function generateToken(payload: any, expiresIn: number) {
  return jwt.sign(payload, "jedJlxSecret2023", { expiresIn: expiresIn });
}
