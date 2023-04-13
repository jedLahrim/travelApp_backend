import { Object, Type } from "../types/types";
import { getRepository } from "typeorm";
import { User } from "../entities/user.entity";
import { Request } from "express";

export const GetUser = async (req: Request): Promise<User> => {
  const object: Type<Object> = req.user;
  let userRepo = getRepository(User);
  return await userRepo.findOne({ where: { email: object.user } });
};
