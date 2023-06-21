import {
  BaseEntity,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Destination } from "./destination.entity";
import { Exclude } from "class-transformer";
import { User } from "./user.entity";
import {excludeProperties} from "../plugins/exlude-from-json.plugin";
@Entity()
export class Favourite extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt: Date;
  @OneToOne((_type) => Destination, (destination) => destination.favourite, {
    eager: true,
    cascade: false,
  })
  // @Exclude()
  destination: Destination;
  @ManyToOne(() => User, (user) => user.favourites, {
    onDelete: "CASCADE",
  })
  @Exclude()
  user: User;
  toJSON() {
    return excludeProperties(this,['user'])
  }
}
