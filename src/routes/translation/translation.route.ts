import express from "express";
import { Translation } from "../../middleware/translation.middleware";
const router = express.Router();
router.post("/api/translation/translate", async (req, res) => {
  const { text, to_lang } = req.body;
  const translated_text = await Translation.TRANSLATE(text, to_lang);
  res.json({ translated_text: translated_text });
});

export { router as translationRouter };
