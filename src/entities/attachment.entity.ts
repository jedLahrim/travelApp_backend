import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Destination } from "./destination.entity";

@Entity()
export class Attachment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column()
  name: string;
  @Column()
  url: string;
  @ManyToOne(() => Destination, (destination) => destination.attachments, {
    eager: false,
    onDelete: "CASCADE",
  })
  destination: Destination;
}
