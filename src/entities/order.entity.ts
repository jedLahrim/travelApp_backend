import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Exclude } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";
import { User } from "./user.entity";
import { Destination } from "./destination.entity";
import {Status} from "../commons/enums/status.enum";

@Entity()
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ default: null })
  @IsOptional()
  @Exclude()
  paymentIntent?: string;

  @Column({ default: null })
  @IsOptional()
  @Exclude()
  @IsEnum(Status, {
    message: "this status must be a valid status",
  })
  status?: Status;

  @ManyToOne(() => User, (user) => user.orders, {
    eager: false,
    onDelete: "CASCADE",
  })
  @Exclude({ toPlainOnly: true })
  user: User;

  @ManyToOne(() => Destination, (destination) => destination.orders, {
    eager: false,
    onDelete: "CASCADE",
  })
  destination: Destination;
}
