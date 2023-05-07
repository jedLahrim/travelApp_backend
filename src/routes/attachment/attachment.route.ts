import express from "express";
import { authGuard } from "../../jwt/jwt.strategy";
import { upload } from "../../upload/upload.file.multer";
import { v4 as uuid } from "uuid";
import { Attachment } from "../../entities/attachment.entity";
import { S3 } from "aws-sdk";
import { PutObjectCommandInput } from "@aws-sdk/client-s3";
import * as okrabyte from "okrabyte";
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

export { router as attachmentRoute };
