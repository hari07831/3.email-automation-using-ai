import "dotenv/config";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

function encodeMessage(message: string) {
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendAutomationEmail(
  to: string,
  subject: string,
  text: string
) {
  const token = await prisma.googleCalendarToken.findFirst();

  if (!token) {
    throw new Error("Google account is not connected.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: token.access_token ?? undefined,
    refresh_token: token.refresh_token,
    expiry_date: token.expiry_date
      ? Number(token.expiry_date)
      : undefined,
  });

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    text,
  ].join("\r\n");

  console.log("[Email] Sending email through Gmail API.");
  console.log(`[Email] Sending email to: ${to}`);

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodeMessage(message),
    },
  });

  if (!response.data.id) {
    throw new Error("Gmail API did not return an email ID.");
  }

  console.log(`[Email] Gmail accepted email: ${response.data.id}`);

  return {
    messageId: response.data.id,
    accepted: [to],
  };
}