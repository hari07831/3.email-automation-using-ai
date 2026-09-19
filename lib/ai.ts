import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

type GenerateEmailInput = {
  eventName: string;
  eventType: string;
  eventDate: string;
  employeeName?: string;
};

export async function generateAutomationEmail({
  eventName,
  eventType,
  eventDate,
  employeeName,
}: GenerateEmailInput) {
  const recipientName = employeeName || "Employee";

  const prompt = `
Create a professional and warm employee email.

Event name: ${eventName}
Event type: ${eventType}
Event date: ${eventDate}
Employee name: ${recipientName}

Requirements:
- Create a natural, personalized email.
- For a birthday, address the employee by name and give birthday wishes.
- Keep the email suitable for a company workplace.
- Do not mention AI.
- Do not use placeholder text.
- Return JSON only.

Return exactly this format:
{
  "subject": "email subject",
  "body": "email body"
}
`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content:
          "You are a professional corporate employee communication assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_object",
    },
    temperature: 0.8,
    max_tokens: 700,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("AI did not return an email.");
  }

  const result = JSON.parse(content);

  if (!result.subject || !result.body) {
    throw new Error("AI returned an invalid email format.");
  }

  return {
    subject: result.subject,
    body: result.body,
  };
}