import { google } from "googleapis";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization code is missing.",
        },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Google did not provide a refresh token. Please authorize again.",
        },
        { status: 400 }
      );
    }

    await prisma.googleCalendarToken.deleteMany();

    await prisma.googleCalendarToken.create({
      data: {
        access_token: tokens.access_token ?? null,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type ?? null,
        scope: tokens.scope ?? null,
        expiry_date: tokens.expiry_date
          ? BigInt(tokens.expiry_date)
          : null,
      },
    });

    console.log("Google Calendar token saved to MySQL.");

    return NextResponse.json({
      success: true,
      message: "Google Calendar connected and saved successfully.",
    });
  } catch (error) {
    console.error("Google Calendar callback error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Google Calendar connection failed.",
      },
      { status: 500 }
    );
  }
}