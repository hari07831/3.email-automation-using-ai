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
Write a short professional workplace email.

Event: ${eventName}
Type: ${eventType}
Date: ${eventDate}
Employee: ${recipientName}

Rules:
- Personalize using the employee name.
- Keep it warm and professional.
- For birthdays, give birthday wishes.
- For meetings or other events, mention the event clearly.
- Do not mention AI.
- Do not use placeholders.
- Keep the body under 150 words.
- Return only the requested JSON.
`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",

    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],

    response_format: {
      type: "json_schema",
      json_schema: {
        name: "employee_email",
        strict: true,
        schema: {
          type: "object",
          properties: {
            subject: {
              type: "string",
            },
            body: {
              type: "string",
            },
          },
          required: ["subject", "body"],
          additionalProperties: false,
        },
      },
    },

    reasoning_effort: "low",
    include_reasoning: false,
    temperature: 0.3,
    max_completion_tokens: 1200,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("AI did not return an email.");
  }

  const result = JSON.parse(content);

  if (
    typeof result.subject !== "string" ||
    typeof result.body !== "string" ||
    !result.subject.trim() ||
    !result.body.trim()
  ) {
    throw new Error("AI returned an invalid email format.");
  }

  return {
    subject: result.subject,
    body: result.body,
  };
}