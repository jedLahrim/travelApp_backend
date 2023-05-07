import * as admin from "firebase-admin";
export async function sendPushNotificationToToken(
  token: string,
  title: string,
  body: string
): Promise<string> {
  const message = {
    token: token,
    notification: {
      title: title,
      body: body,
    },
  };
  const response = await admin.messaging().send(message);
  console.log("Successfully sent message:", response);
  return response;
}
