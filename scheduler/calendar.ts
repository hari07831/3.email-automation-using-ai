import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function getUpcomingCalendarEvents() {
  const token = await prisma.googleCalendarToken.findFirst();

  if (!token) {
    throw new Error("Google Calendar is not connected.");
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

  return response.data.items ?? [];
}