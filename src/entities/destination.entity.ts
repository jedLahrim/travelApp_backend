import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  OneToMany,
  DeleteDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Favourite } from "./favourite.entity";
import { Exclude } from "class-transformer";
import { Category } from "./category.entity";
import { Order } from "./order.entity";
import {excludeProperties} from "../plugins/exlude-from-json.plugin";
import { Attachment } from "./attachment.entity";
import { StripeIntent } from "./stripe-intent.entity";
import { IsOptional } from "class-validator";

@Entity()
export class Destination extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;
  @Column({ type: "integer" })
  price: number;
  @Column()
  description: string;
  @Column({ type: "double precision" })
  lat: number;

  @Column({ type: "double precision" })
  long: number;
  // @Column({
  //   type: "simple-json",
  //   spatialFeatureType: "Point",
  //   srid: 4326,
  //   // nullable: true,
  // })
  // location: Point;
  @Column({ default: null })
  image_url?: string;
  @Column({ default: null })
  primaryAttachment?: string;
  @Column({ default: null })
  joinedNumberParticipants?: number;
  @Column({ default: null })
  @IsOptional()
  maxTravelers?: number;
  @Column({ default: null })
  @IsOptional()
  requiredNumberTravelers: number;
  @Column()
  startDate: Date;
  @Column()
  endDate: Date;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt: Date;
  @OneToOne(() => Favourite, (favourite) => favourite.destination, {
    cascade: false,
  })
  @JoinColumn()
  favourite: Favourite;
  @ManyToOne(() => User, (user) => user.destinations, {
    onDelete: "CASCADE",
  })
  @Exclude()
  user: User;
  @ManyToOne(() => Category, (category) => category.destinations, {
    onDelete: "CASCADE",
  })
  @Exclude({ toPlainOnly: true, toClassOnly: true })
  category: Category;
  @OneToMany((_type) => Order, (order) => order.destination, {
    eager: true,
    onDelete: "CASCADE",
  })
  orders: Order[];
  @OneToMany((_type) => Attachment, (attachment) => attachment.destination, {
    eager: true,
    onDelete: "CASCADE",
  })
  attachments: Attachment[];
  @OneToMany(
    (_type) => StripeIntent,
    (stripeIntent) => stripeIntent.destination,
    {
      eager: true,
      onDelete: "CASCADE",
    }
  )
  stripeIntents: StripeIntent[];
  toJSON() {
return excludeProperties(this,['stripeIntents','attachments','orders'])
  }

  get isAllowedToOrder(): boolean {
    const now = new Date();
    // check event is started or still not
    // started mean no one allowed to order
    if (this.startDate >= now) return false;

    if (this.maxTravelers) {
      // if joined participants already satisfy maxParticipants
      // if satisfy return false mean no one allowed to order
      // else return tru mean you can still order
      return this.joinedNumberParticipants < this.maxTravelers;
    } else {
      // no limitation for the maxParticipants so you anyone can order
      return true;
    }
  }
  get isMinParticipantsAttended(): boolean {
    return this.joinedNumberParticipants >= this.requiredNumberTravelers;
  }
}
