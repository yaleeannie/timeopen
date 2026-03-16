import crypto from "crypto";

const API_KEY = process.env.SOLAPI_API_KEY!;
const API_SECRET = process.env.SOLAPI_API_SECRET!;
const SENDER = process.env.SOLAPI_SENDER!;

function getAuthHeaders() {
  const date = new Date().toISOString();
  const salt = crypto.randomUUID();
  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(date + salt)
    .digest("hex");

  return {
    Authorization: `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
    "Content-Type": "application/json",
  };
}

export async function sendSms(to: string, text: string) {
  console.log("[sendSms] to =", to, "from =", SENDER);
  console.log("[sendSms] text =", text);

  const res = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      messages: [
        {
          to,
          from: SENDER,
          text,
        },
      ],
    }),
  });

  const bodyText = await res.text();
  console.log("[sendSms] status =", res.status);
  console.log("[sendSms] body =", bodyText);

  if (!res.ok) {
    throw new Error("SMS error: " + bodyText);
  }
}