import express from "express";
import { TwilioMessage } from "../../message/twilio.message";

const router = express.Router();
router.post("/api/send-sms", (req, res) => {
  TwilioMessage.SEND_SMS();
  res.json({ success: "sms sent successfully to this phone number" });
});

export { router as twilioRouter };
