import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const token = await prisma.googleCalendarToken.findFirst();

    if (!token) {
      return Response.json(
        {
          success: false,
          message: "Google Calendar is not connected.",
        },
        { status: 401 }
      );
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

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    const now = new Date();

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items ?? [];

    return Response.json({
      success: true,
      events: events.map((event) => ({
        id: event.id,
        summary: event.summary ?? "Untitled Event",
        description: event.description ?? "",
        start: event.start?.dateTime ?? event.start?.date ?? null,
        end: event.end?.dateTime ?? event.end?.date ?? null,
        location: event.location ?? "",
      })),
    });
  } catch (error) {
    console.error("Google Calendar events error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch Google Calendar events.",
      },
      { status: 500 }
    );
  }
}