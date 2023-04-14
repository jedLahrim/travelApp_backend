import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Refund extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column()
  reason: string;
}
