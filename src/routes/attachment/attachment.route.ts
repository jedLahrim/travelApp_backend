import express from "express";
import { authGuard } from "../../jwt/jwt.strategy";
import { upload } from "../../upload/upload.file.multer";
import process from "process";
import { v4 as uuid } from "uuid";
import { Attachment } from "../../entities/attachment.entity";
import { S3 } from "aws-sdk";
import { PutObjectCommandInput } from "@aws-sdk/client-s3";

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
        const bucket = process.env.AWS_BACKET_NAME;
        const accessKeyId = process.env.AWS_ACCESS_KEY;
        const secretAccessKey = process.env.AWS_SECRET_KEY;
        const key = `${uuid()}-${file.originalname}`;
        const awsFile: PutObjectCommandInput = {
          Body: file.buffer,
          Bucket: bucket,
          Key: key,
          ContentType: file.mimetype,
          ACL: "public-read",
        };
        const s3 = new S3({
          credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
          },
        });
        const sendData = await s3.upload(awsFile).promise();
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

export { router as attachmentRoute };
