/* eslint-disable */
const functions = require("firebase-functions");
const twilio = require("twilio");

const client = twilio(
  functions.config().twilio.account_sid,
  functions.config().twilio.auth_token
);

exports.sendSMS = functions.https.onCall(async (data, context) => {
  try {
    const { to, message } = data;

    const result = await client.messages.create({
      body: message,
      from: functions.config().twilio.phone_number,
      to: to,
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});
