import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CategoryType } from "../commons/enums/category-type";
import { Destination } from "./destination.entity";
import { Exclude } from "class-transformer";
import {excludeProperties} from "../plugins/exlude-from-json.plugin";

@Entity()
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({ nullable: true })
  name?: CategoryType;

  @OneToMany((_type) => Destination, (destination) => destination.category, {
    eager: true,
    onDelete: "CASCADE",
  })
  @Exclude()
  destinations: Destination[];
  toJSON() {
    return excludeProperties(this,['destinations'])
  }
}
