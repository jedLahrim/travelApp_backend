import { connect, Message } from "amqplib";
import { Worker, Queue } from "bullmq";
import { redisConfiguration } from "../queue/config/queue.config";

export async function initRabbitMQ() {
  const connection = await connect({ port: 5672, hostname: "localhost" });
  return await connection.createChannel();
}
function CONSUME_RABBITMQ_QUEUE(queueName: string) {
  return function (
    target: any,
    key: PropertyKey,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const channel = await initRabbitMQ();
      if (!channel) {
        console.log("no channel founded");
      }
      await channel.consume(queueName, (data: Message) => {
        if (data !== null) {
          const queueData = JSON.parse(data.content.toString());
          console.log("Received:", queueData);
          channel.ack(data);
        } else {
          console.log("Consumer cancelled by server");
        }
      });
      await originalMethod.apply(this, args);
    };
    return descriptor;
  };
}
export class RabbitMQ {
  @CONSUME_RABBITMQ_QUEUE("task_queue")
  async hello() {
    let msg = { name: "hello", port: 2030, proxy: true };
    const channel1 = await initRabbitMQ();
    await channel1.assertQueue("task_queue", {
      durable: true,
    });
    // Sender
    channel1.sendToQueue("task_queue", Buffer.from(JSON.stringify(msg)));
  }
}
