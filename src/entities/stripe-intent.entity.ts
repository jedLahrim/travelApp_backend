import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Destination } from "./destination.entity";
import { User } from "./user.entity";

@Entity()
export class StripeIntent extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column()
  paymentIntent?: string;
  @Column()
  setupIntent?: string;

  @ManyToOne((_type) => User, (user) => user.stripeIntents, {
    eager: false,
    onDelete: "CASCADE",
  })
  user: User;
  @ManyToOne(
    (_type) => Destination,
    (destination) => destination.stripeIntents,
    {
      eager: false,
      onDelete: "CASCADE",
    }
  )
  destination: Destination;
}
