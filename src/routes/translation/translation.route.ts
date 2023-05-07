import express from "express";
import { Translation } from "../../middleware/translation.middleware";
import { upload } from "../../upload/upload.file.multer";
const router = express.Router();
router.get("/api/translation/translate", async (req, res) => {
  const { text, targetLanguage } = req.body;
  const translatedPhrase = await Translation.TRANSLATE(text, targetLanguage);
  res.json(translatedPhrase);
});

export { router as translationRouter };
