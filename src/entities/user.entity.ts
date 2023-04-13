import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Exclude } from "class-transformer";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Destination } from "./destination.entity";
import { excludeProperty } from "../plugins/exlude-from-json.plugin";
import { Favourite } from "./favourite.entity";
import { Order } from "./order.entity";
import { StripeIntent } from "./stripe-intent.entity";
@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  @Column()
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "password is too weak",
  })
  @Exclude()
  password: string;

  @Column({ default: null })
  profilePicture?: string;
  access: string;
  refresh: string;
  refreshExpireAt: Date;
  accessExpireAt: Date;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  customerId: string;
  @OneToMany((_type) => Destination, (destinations) => destinations.user, {
    eager: true,
    onDelete: "CASCADE",
  })
  destinations: Destination[];
  @OneToMany((_type) => Order, (order) => order.user, {
    eager: true,
    onDelete: "CASCADE",
  })
  orders: Order[];
  @OneToMany((_type) => Favourite, (favourite) => favourite.user, {
    eager: true,
    onDelete: "CASCADE",
  })
  favourites: Favourite[];
  @OneToMany((_type) => StripeIntent, (stripeIntent) => stripeIntent.user, {
    eager: true,
    onDelete: "CASCADE",
  })
  stripeIntents: StripeIntent[];
  toJSON() {
    return excludeProperty(
      this,
      "password",
      "destinations",
      "favourites",
      "orders",
      "stripeIntents"
    );
  }
}
