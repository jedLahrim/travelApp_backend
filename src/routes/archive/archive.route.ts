import express from "express";
import { upload } from "../../upload/upload.file.multer";
import { Library } from "../../upload/library/compress.file.multer";
import { v4 as uuid } from "uuid";
import { uploadAws } from "../attachment/attachment.route";
const router = express.Router();
router.post("/api/upload/compress", upload.single("file"), async (req, res) => {
  const compressedFile = await Library.COMPRESS_FILE(req.file?.buffer);
  const key = `${uuid()}-${req.file.originalname}.zip`;
  req.file.buffer = Buffer.alloc(0);
  req.file.buffer = compressedFile;
  req.file.mimetype = "application/zip";
  const sendData = await uploadAws(req.file, key);
  return res.json({ path: sendData.Location });
});
export { router as archiveRouter };
