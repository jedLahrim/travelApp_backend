import express from "express";
import { authGuard } from "../../jwt/jwt.strategy";
import { upload } from "../../upload/upload.file.multer";
import { v4 as uuid } from "uuid";
import { Attachment } from "../../entities/attachment.entity";
import { S3 } from "aws-sdk";
import { PutObjectCommandInput } from "@aws-sdk/client-s3";
import * as okrabyte from "okrabyte";
import axios from "axios";
import { Constant } from "../../commons/constant";
import { VoiceCode } from "../../commons/enums/voice-code.enum";
import { body } from "express-validator";
import { ValidationErrors } from "../../validation/validation.errors";
import { calculateWomanPeriod } from "get-women-period/libs/period/women-period";
import { GoogleMap } from "../../geo/google-map";
const router = express.Router();
router.post(
  "/api/attachment/upload",
  upload.single("file"),
  authGuard,
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).send("No file uploaded.");
      } else {
        const key = `${uuid()}-${file.originalname}`;
        const sendData = await uploadAws(file, key);
        // save attachment after upload
        const { name } = req.body;
        const attachment = Attachment.create({
          name: name ?? key,
          url: sendData.Location,
        });
        await Attachment.save(attachment);
        res.json(attachment);
      }
    } catch (err) {
      res.status(500).send(err);
    }
  }
);
export async function uploadAws(file: Express.Multer.File, key) {
  const awsFile: PutObjectCommandInput = {
    Body: file.buffer,
    Bucket: process.env.AWS_BACKET_NAME,
    Key: key,
    ContentType: file?.mimetype,
    // ACL: "public-read",
  };
  const s3 = new S3({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    },
  });
  return await s3.upload(awsFile).promise();
}
router.get("/api/readFile/get", upload.single("file"), async (req, res) => {
  const { address } = req.body;
  const data = await GoogleMap.GET_LOCATION(address);
  res.json({ data: data });
  try {
    okrabyte.decodeBuffer(req.file.buffer, (error, data) => {
      console.log(data);
      const text = data.replace(/\n/g, "");
      res.json({ text: text });
    });
  } catch (e) {
    res.json({ err: e });
  }
});
router.post(
  "/text-to-speech",
  body("language").custom((language, { req }) => {
    if (!Object.values(VoiceCode).includes(language)) {
      throw new Error("put a valid language like: ENGLISH, SPANISH or ARABIC");
    }
    return true;
  }),
  body("text")
    .notEmpty({ ignore_whitespace: true })
    .withMessage("text cannot be empty")
    .isString()
    .withMessage("put a valid text to give you the speech for it"),
  body("speed")
    .isFloat({
      min: Number.MIN_SAFE_INTEGER,
      max: Number.MAX_SAFE_INTEGER,
      gt: 0,
      lt: 3,
    })
    .withMessage("invalid speaking speed, must be from 0.00 to 3.00'"),
  body("pitch")
    .isFloat({
      min: Number.MIN_SAFE_INTEGER,
      max: Number.MAX_SAFE_INTEGER,
      gt: 0,
      lt: 2,
    })
    .withMessage("invalid pitch, must be from 0.00 to 2.00'"),
  ValidationErrors,
  async (req, res) => {
    let { language, text, speed, pitch } = req.body;
    let voiceCode: string;
    switch (language) {
      case VoiceCode.ENGLISH:
        voiceCode = "en-US-1";
        break;
      case VoiceCode.SPANISH:
        voiceCode = "es-ES-1";
        break;
      case VoiceCode.ARABIC:
        voiceCode = "ar-SA-1";
        break;
    }
    let encodedParams = generateEncodedParams(voiceCode, text, speed, pitch);
    const options =
      Constant.TEXT_TO_SPEECH_OPTION_FIRST_PROVIDER(encodedParams);

    try {
      const response = await axios.request(options);
      console.log(response.data);
      res.json(response.data.result);
    } catch (error) {
      const options = Constant.TEXT_TO_SPEECH_OPTION_SECOND_PROVIDER(
        language,
        text,
      );
      const response = await axios.request(options);
      console.log(response.data);
      res.json(response.data);
    }
  }
);
export function generateEncodedParams(
  voiceCode: string,
  text: string,
  speed: string,
  pitch: string
) {
  const encodedParams = new URLSearchParams();
  encodedParams.set("voice_code", voiceCode);
  encodedParams.set("text", text);
  encodedParams.set("speed", speed);
  encodedParams.set("pitch", pitch);
  encodedParams.set("output_type", Constant.OUTPUT_TYPE);
  return encodedParams;
}
router.post("/api/locate", async (req, res) => {
  const { phoneNumber } = req.body;
  const client = require("twilio")(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  const response = await client.lookups.v1.phoneNumbers(phoneNumber).fetch({
    type: ["carrier"],
    addOns: ["twilio_ip_geolocation"],
  });
  console.log(response);
  res.json(response.geojson.features[0].properties);
});
export { router as attachmentRoute };
