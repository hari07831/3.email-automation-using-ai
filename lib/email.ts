import "dotenv/config";
import nodemailer from "nodemailer";

export async function sendAutomationEmail(
  to: string,
  subject: string,
  text: string
) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error("Email configuration is missing.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  await transporter.verify();

  console.log("[Email] SMTP connection verified.");
  console.log(`[Email] Sending email to: ${to}`);

  const result = await transporter.sendMail({
    from: `"Employee Event Automation" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });

  if (!result.accepted || result.accepted.length === 0) {
    throw new Error(`Gmail did not accept recipient: ${to}`);
  }

  console.log(`[Email] Email accepted by Gmail: ${to}`);
  console.log(`[Email] Message ID: ${result.messageId}`);

  return result;
}