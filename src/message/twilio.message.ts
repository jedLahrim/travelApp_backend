export class TwilioMessage{
    static SEND_SMS = function(){
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const client = require("twilio")(accountSid, authToken);
        client.messages
            .create({ body: "Hello from Senlife", from: "+12542804965", to: "+212631547953" })
            .then(message => console.log(message.sid));
    }
}