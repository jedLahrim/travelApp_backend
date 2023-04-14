import express from "express";
import cors from "cors";
import { createConnection } from "typeorm";
import { userRoute } from "./routes/user/user.routes";
import { destinationRoute } from "./routes/destination/destination.routes";
import { favouriteRoute } from "./routes/favourite/favourite.route";
import { categoryRoute } from "./routes/category/category.route";
import { attachmentRoute } from "./routes/attachment/attachment.route";
import { orderRoute } from "./routes/order/order.route";
import process from "process";
require("dotenv").config({ path: ".env", debug: true });
const main = async () => {
  try {
    await createConnection({
      type: "postgres",
      host: process.env.HOST,
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      entities: ["src/entities/*.entity.ts"],
      synchronize: true,
    });
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({extended: false}));
    // use cors
    app.use(cors());
    const routes = [
      userRoute,
      destinationRoute,
      favouriteRoute,
      categoryRoute,
      attachmentRoute,
      orderRoute,
    ];
    routes.forEach((router) => {
      app.use(router);
    });
    app.listen("3001", (): void => {
      console.log("Server Running!");
    });
  } catch (error) {
    console.error(error);
    throw new Error("Unable to connect to db");
  }
};
main();
