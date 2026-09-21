import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAutomationEmail(
  to: string,
  subject: string,
  text: string
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Resend API configuration is missing.");
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  console.log("[Email] Sending email through Resend.");
  console.log(`[Email] Sending email to: ${to}`);

  const { data, error } = await resend.emails.send({
    from: `Employee Event Automation <${fromEmail}>`,
    to: [to],
    subject,
    text,
  });

  if (error) {
    console.error("[Email] Resend error:", error);
    throw new Error(`Resend email failed: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("Resend did not return an email ID.");
  }

  console.log(`[Email] Email accepted by Resend: ${data.id}`);

  return {
    messageId: data.id,
    accepted: [to],
  };
}