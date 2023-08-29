import { Queue, Worker } from "bullmq";
import { EventEmitter } from "node:events";
import { scheduler } from "node:timers/promises";
import axios from "axios";
import * as querystring from "querystring";
import { Response, Request } from "express";
export const redisConfiguration = {
  connection: {
    host: "localhost",
    port: 6379,
  },
};
export const queue = new Queue("emailSchedule", redisConfiguration);
export const ADD_QUEUE = (queueName: string, delay: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Store the original method so we can call it later
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const result = (await originalMethod.apply(this, args)) as {
        text: string;
        date: Date;
      };
      await queue.add(queueName, { args }, { delay });
      console.log("Adding job to the queue...");
      return result;
    };
  };
};
new Worker(
  "emailSchedule",
  (job): any => {
    console.log(job.data);
  },
  redisConfiguration
);

export class Test {
  @ADD_QUEUE("emailSchedule", 10000)
  test(name: string, data?: { text: string; date: Date }) {
    console.log(name);
    data = { text: "hello me", date: new Date("2-2-2020") };
    return data;
  }
}
export const myEmitter = new EventEmitter();

const targetTime = new Date("2023-08-06T19:20:00");
myEmitter.on("greet", async (data) => {
  await scheduler.wait(10000, { ref: true });
  console.log(data);
});
async function appleSignIn(res: Response, req: Request) {
  const requestBody = {
    grant_type: "authorization_code",
    code: req.body.code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.token,
    scope: process.env.SCOPE,
  };
  const axiosResponse = await axios.post(
    "https://appleid.apple.com/auth/token",
    querystring.stringify(requestBody),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  console.log(axiosResponse.data);
}
