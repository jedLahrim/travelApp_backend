import express from "express";
import * as admin from "firebase-admin";
import { sendPushNotificationToToken } from "../../firebase/notifiaction";
const router = express.Router();
router.post("/api/notifications", async (req, res) => {
  const { token, title, body } = req.body;
  const serviceAccount = require("eventapp-50de1-firebase-adminsdk-wx71i-a0a7353c6c.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://eventapp-50de1-default-rtdb.firebaseio.com",
  });
  try {
    const response = await sendPushNotificationToToken(token, title, body);
    res.json(response);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});
export { router as notificationRouter };
