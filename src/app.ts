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
import { mapRoute } from "./routes/map/map.route";
import { twilioRouter } from "./routes/twilio/twilio.routes";
import rateLimit from "express-rate-limit";
import { createServer, plugins } from "restify";
import * as Hapi from "@hapi/hapi";
import * as dgram from "dgram";
import {initMysql2} from "./sql/connection/sql-connection";
dotenv.config({ path: ".env", debug: true });
export const appDataSource = new DataSource({
  useUTC: true,
  type: "postgres",
  host: process.env.HOST,
  port: 5432,
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
// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max number of requests
});
app.use(limiter);
// use cors
app.use(cors());
// initDataGram()
initMysql2()
export const hapiServer = Hapi.server({ port: 3002, host: "localhost" });
const init = async () => {
  await hapiServer.start();
  console.log("Server running on %s", hapiServer.info.uri);
};
hapiServer.route({
  method: "GET",
  path: "/",
  handler: (request, response) => {
    return "Hello World!";
  },
});
init();
// const server = createServer({
//   name: "myapp",
//   version: "1.0",
// });
// server.use(plugins.acceptParser(server.acceptable));
// server.use(plugins.queryParser());
// server.use(plugins.bodyParser());
// server.get("/", function (req, res, next) {
//   res.json("hello world");
//   return "hello world";
// });

// server.listen(1612, function () {
//   console.log("%s listening at %s", server.name, server.url);
// });

// server.use(init);
appDataSource
  .initialize()
  .then(() => {
    console.log("database connected");
    const routes = [
      userRoute,
      mapRoute,
      destinationRoute,
      favouriteRoute,
      categoryRoute,
      attachmentRoute,
      orderRoute,
      translationRouter,
      notificationRouter,
      archiveRouter,
      twilioRouter,
    ];
    routes.forEach((router) => {
      app.use(router);
    });
    app.listen("3001", (): void => {
      console.log("Server Running!");
    });
  })
  .catch((err) => {
    console.log(err);
  });
