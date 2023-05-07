import { User } from "../entities/user.entity";
import { Request } from "express";

export const GetUser = async (req: Request): Promise<User> => {
  const object: any = req.user;
  return await User.findOne({ where: { email: object.user } });
};
