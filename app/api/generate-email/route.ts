import Groq from "groq-sdk";

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        {
          success: false,
          message: "GROQ_API_KEY is missing from the .env file.",
        },
        { status: 500 }
      );
    }

    const {
      eventName,
      eventType,
      eventDate,
      tone,
      description,
    } = await request.json();

    if (!eventName || !eventDate || !description) {
      return Response.json(
        {
          success: false,
          message:
            "Event name, event date, and event description are required.",
        },
        { status: 400 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `
You are an intelligent employee communication assistant.

Your job is to create a UNIQUE, meaningful and professional employee
email based on the exact event information supplied by the administrator.

IMPORTANT RULES:

1. Generate fresh content for EVERY request.
2. The email must be specifically about the supplied event.
3. Understand the purpose of the event from the description.
4. Use the actual event name.
5. Use the actual event type.
6. Use the actual event date.
7. Use the supplied description.
8. Respect the requested tone.
9. Never use a generic reusable company announcement.
10. Never invent information that was not supplied.
11. Do not invent a location, time, speaker, agenda, deadline,
    department or instructions.
12. Make the email sound natural and human.
13. Make the subject concise and relevant to the event.
14. The body should clearly explain what the event is about
    and why employees should know about it.
15. Do not include Markdown formatting.
16. Do not include "Subject:" inside the subject value.
17. Do not include greetings such as "Dear Team" in the subject.
18. Return ONLY valid JSON.

The JSON must have exactly these two fields:

{
  "subject": "event-specific email subject",
  "body": "complete email body"
}
`;

    const userPrompt = `
Create a new employee email for this event.

Event Name:
${eventName}

Event Type:
${eventType || "Not specified"}

Event Date:
${eventDate}

Email Tone:
${tone || "Professional"}

Event Description / Purpose:
${description}

Use these details to understand the actual purpose of the event.

The result must be a new email written specifically for this event.
`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],

      temperature: 0.8,
      max_tokens: 700,

      response_format: {
        type: "json_object",
      },
    });

    const content =
      completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return Response.json(
        {
          success: false,
          message: "Groq returned an empty response.",
        },
        { status: 500 }
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error("Invalid JSON returned by Groq:", content);

      return Response.json(
        {
          success: false,
          message: "AI returned an invalid email format.",
        },
        { status: 500 }
      );
    }

    if (
      !parsed.subject ||
      !parsed.body ||
      typeof parsed.subject !== "string" ||
      typeof parsed.body !== "string"
    ) {
      return Response.json(
        {
          success: false,
          message: "AI response is missing subject or email body.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      subject: parsed.subject.trim(),
      body: parsed.body.trim(),

      // Keep the combined version for compatibility
      // with your existing frontend.
      email: `Subject: ${parsed.subject.trim()}\n\n${parsed.body.trim()}`,
    });
  } catch (error) {
    console.error("Groq AI generation error:", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Groq AI generation failed.",
      },
      { status: 500 }
    );
  }
}