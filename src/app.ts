import express from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import process from "process";
import dotenv from "dotenv";
import { Attachment } from "./entities/attachment.entity";
import { Category } from "./entities/category.entity";
import { Destination } from "./entities/destination.entity";
import { Favourite } from "./entities/favourite.entity";
import { Order } from "./entities/order.entity";
import { Refund } from "./entities/refund.entity";
import { StripeIntent } from "./entities/stripe-intent.entity";
import { User } from "./entities/user.entity";
import { userRoute } from "./routes/user/user.routes";
import { destinationRoute } from "./routes/destination/destination.routes";
import { favouriteRoute } from "./routes/favourite/favourite.route";
import { categoryRoute } from "./routes/category/category.route";
import { attachmentRoute } from "./routes/attachment/attachment.route";
import { orderRoute } from "./routes/order/order.route";
import { translationRouter } from "./routes/translation/translation.route";
import { notificationRouter } from "./routes/notification/notifications.route";
import { archiveRouter } from "./routes/archive/archive.route";
dotenv.config({ path: ".env", debug: true });
export const appDataSource = new DataSource({
  type: "mysql",
  host: process.env.HOST,
  port: 3306,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: [
    Attachment,
    Category,
    Destination,
    Favourite,
    Order,
    Refund,
    StripeIntent,
    User,
  ],
  synchronize: true,
});
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// use cors
app.use(cors());
appDataSource
  .initialize()
  .then(() => {
    console.log("database connected");
    const routes = [
      userRoute,
      destinationRoute,
      favouriteRoute,
      categoryRoute,
      attachmentRoute,
      orderRoute,
      translationRouter,
      notificationRouter,
      archiveRouter,
    ];
    routes.forEach((router) => {
      app.use(router);
    });
    app.listen(3001, (): void => {
      console.log("Server Running!");
    });
  })
  .catch((err) => {
    console.log(err);
  });
