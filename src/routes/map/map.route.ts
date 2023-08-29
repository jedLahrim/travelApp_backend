import express from "express";
import { ValidationErrors } from "../../validation/validation.errors";
import { upload } from "../../upload/upload.file.multer";
import * as wavConverter from "wav-converter";
import * as LocalStorage from "node-localstorage";
import { WaveFile } from "wavefile";
import { Request, Response } from "express";
import {
  ADD_QUEUE,
  myEmitter,
  queue,
  redisConfiguration,
  Test,
} from "../../queue/config/queue.config";
import { Worker } from "worker_threads";
import { initRabbitMQ, RabbitMQ } from "../../rabbitMQ/rabbitMQ";
// import { client, server } from "../../node/data-gram/data-gram";
import * as path from "path";
import { Message } from "amqplib";
import { EXECUTE_QUERY, initMysql2 } from "../../sql/connection/sql-connection";
import { Sql } from "../../commons/enums/sql.type";
// import { RabbitMQ } from "../../rabbitMQ/rabbitMQ";
const router = express.Router();

async function _create(req: Request) {
  await EXECUTE_QUERY(`insert into employee (EmpName, EmpBOD, EmpJoiningDate, PrevExperience, Salary, Address, user_id) 
       VALUES ('${req.body.EmpName}','${req.body.EmpBOD}',
       '${req.body.EmpJoiningDate}',${req.body.PrevExperience},${req.body.Salary},
       '${req.body.Address}',${req.body.user_id})`);
}

async function _findAll(req: Request) {
  let query: Sql<any>;
  if (req.body.gender)
    query =
      await EXECUTE_QUERY(`SELECT distinct user.*, e.Salary FROM user inner join employee e on user.id = e.user_id 
        where e.Salary BETWEEN ${req.body.minSalary} and ${req.body.maxSalary} 
        and user.gender='${req.body.gender}' ORDER BY e.Salary ${
        req.body.order ?? "desc"
      }`);
  else {
    query =
      await EXECUTE_QUERY(`SELECT distinct user.*, e.Salary FROM user inner join employee e on user.id = e.user_id 
        where e.Salary BETWEEN ${req.body.minSalary} and ${req.body.maxSalary} 
         ORDER BY e.Salary ${req.body.order ?? "desc"}`);
  }
  let [result] = query;
  console.log(result);
  return result;
}

async function _update(
  value: any,
  columName: string,
  tableName: string,
  criteria: any
) {
  const entity: Sql<any> = await EXECUTE_QUERY(
    `update ${tableName} set ${columName} = '${value}' where id=${criteria}`
  );
  return entity;
}

router.get(
  "/api/location/address",
  upload.single("file"),
  // body("address").isString().withMessage("address must be string"),
  ValidationErrors,
  async (req, res) => {
    // let test = new Test();
    // test.test("hello");
    // myEmitter.emit("greet", {name: "hello"});
    let test = new RabbitMQ();
    await test.hello();
    res.json("");
  }
);
let localStoragePath = path.join(__dirname, "./scratch");
export const localStorage = new LocalStorage.JSONStorage(localStoragePath);
export const sleep = () => {};
export function sendEmail(job): any {
  const { email, message } = job.data;
  console.log(`Message ${message} was sent to ${email}.`);
  return "";
}
async function generateText(file: Express.Multer.File) {
  let TransformersApi = Function('return import("@xenova/transformers")')();
  const { pipeline, env } = await TransformersApi;
  // Load audio data
  // let transcriber = await pipeline(
  //   "automatic-speech-recognition",
  //   "Xenova/whisper-small.en"
  // );
  let wav = new WaveFile(file.buffer);
  // Pipeline expects input as a Float32Array
  // let audioData = wav.getSamples();
  // let start = performance.now();
  // let output = await transcriber(audioData[0]);
  // let end = performance.now();
  // console.log(`Execution duration: ${(end - start) / 1000} seconds`);
  // console.log(output);
}
// Listen for job completion
async function emailSchedule(email, message, delay) {
  await queue.add("email", { email, message }, { delay });
}
export const FILE_EXTENSION = function (file: Express.Multer.File) {
  return file.originalname.split(".").pop();
};

export const SPEECH_SUPPORTED_AUDIO_EXTENSION = [
  "mp3",
  "wav",
  "ogg",
  "web",
  "flac",
];
async function convertToWav(
  file: Express.Multer.File,
  extension: string
): Promise<Buffer> {
  const wavData: Buffer = wavConverter.encodeWav(file.buffer, {
    numChannels: 1,
    sampleRate: 16000,
    byteRate: 16,
  });
  return wavData;
}
export { router as mapRoute };
async function _deleteDupRows(tableName: string, columnName: string) {
  await EXECUTE_QUERY(
    `DELETE x1 FROM ${tableName} x1,${tableName} x2 WHERE x1.id < x2.id AND x1.${columnName} = x2.${columnName}`
  );
}
async function _delete(tableName: string, criteria: any) {
  const [entity]: Sql<any> = await EXECUTE_QUERY(
    `delete from ${tableName} where ${tableName}.id=${criteria}`
  );
  return entity;
}

router.get("/api/get", async (req, res) => {
  try {
    let users: any = await _findAll(req);
    res.json({ data: users, total: users.length });
  } catch (e) {
    res.json({ err: "SqlException" });
  }
});
router.post("/api/create", async (req, res) => {
  try {
    await _create(req);
    res.json({ message: `created successfully` });
  } catch (e) {
    res.json({ err: "SqlException" });
  }
});
router.patch("/api/update/:criteria", async (req, res) => {
  try {
    const entity = await _update(
      req.body.value,
      req.body.column,
      req.body.table,
      req.params.criteria
    );
    entity.affectedRows == 0
      ? res.json({
          err: `NOT FOUND RECORD IN TABLE ${req.body.table.toUpperCase()}`,
        })
      : res.json({ message: `updated successfully` });
  } catch (e) {
    res.json({ err: "SqlException" });
  }
});
router.delete("/api/delete/dup-rows", async (req, res) => {
  try {
    await _deleteDupRows(req.body.table, req.body.column);
    res.json({ message: `duplicate rows deleted successfully` });
  } catch (e) {
    res.json({ err: "SqlException" });
  }
});
router.delete("/api/delete/:id", async (req, res) => {
  try {
    const entity = await _delete(req.body.table, req.params.id);
    entity.affectedRows == 0
      ? res.json({
          err: `NOT FOUND RECORD IN TABLE ${req.body.table.toUpperCase()}`,
        })
      : res.json({ message: `deleted successfully` });
  } catch (e) {
    res.json({ err: "SqlException" });
  }
});
