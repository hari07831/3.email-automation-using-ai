"use client";

import { useEffect, useState } from "react";

type CalendarEvent = {
  id: string;
  summary: string;
  description: string;
  start: string | null;
  end: string | null;
  location: string;
};

export default function AIGenerationPage() {
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Company Meeting");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Professional");

  const [generatedEmail, setGeneratedEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Google Calendar
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  async function loadCalendarEvents() {
    setCalendarLoading(true);

    try {
      const response = await fetch("/api/calendar/events");
      const data = await response.json();

      if (!response.ok || !data.success) {
        setCalendarConnected(false);
        return;
      }

      setCalendarConnected(true);
      setCalendarEvents(data.events || []);
    } catch (error) {
      console.error("Calendar loading error:", error);
      setCalendarConnected(false);
    } finally {
      setCalendarLoading(false);
    }
  }

  function connectGoogleCalendar() {
    window.location.href = "/api/auth/google";
  }

  function detectEventType(eventName: string) {
    const name = eventName.toLowerCase();

    // Birthday
    if (
      name.includes("birthday") ||
      name.includes("happy birthday") ||
      name.includes("bday")
    ) {
      return "Birthday";
    }

    // Festival
    if (
      name.includes("diwali") ||
      name.includes("deepavali") ||
      name.includes("pongal") ||
      name.includes("christmas") ||
      name.includes("new year") ||
      name.includes("onam") ||
      name.includes("holi") ||
      name.includes("eid") ||
      name.includes("ramadan") ||
      name.includes("dussehra") ||
      name.includes("navratri") ||
      name.includes("ganesh chaturthi") ||
      name.includes("janmashtami") ||
      name.includes("raksha bandhan") ||
      name.includes("ugadi") ||
      name.includes("vishu") ||
      name.includes("baisakhi")
    ) {
      return "Festival";
    }

    // Company Meeting
    if (
      name.includes("meeting") ||
      name.includes("conference") ||
      name.includes("review") ||
      name.includes("discussion")
    ) {
      return "Company Meeting";
    }

    // Training
    if (
      name.includes("training") ||
      name.includes("workshop") ||
      name.includes("seminar") ||
      name.includes("orientation")
    ) {
      return "Training";
    }

    // Work Anniversary
    if (
      name.includes("anniversary") ||
      name.includes("work anniversary")
    ) {
      return "Work Anniversary";
    }

    // Celebration
    if (
      name.includes("celebration") ||
      name.includes("party") ||
      name.includes("function")
    ) {
      return "Celebration";
    }

    return "Other";
  }

  function selectCalendarEvent(event: CalendarEvent) {
    setEventName(event.summary);

    if (event.start) {
      const date = new Date(event.start);

      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        setEventDate(`${year}-${month}-${day}`);
      }
    }

    // Automatically identify the event type
    const detectedType = detectEventType(event.summary);

    setEventType(detectedType);

    const eventDescription = [
      event.description,
      event.location ? `Location: ${event.location}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    // Festival fallback description
    if (detectedType === "Festival" && !eventDescription) {
      setDescription(
        `${event.summary} festival greeting for employees.`
      );
    } else if (detectedType === "Birthday" && !eventDescription) {
      setDescription(
        `Personalized birthday greeting for the employee.`
      );
    } else {
      setDescription(eventDescription);
    }

    setGeneratedEmail("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function generateEmail() {
    if (!eventName || !eventDate || !description) {
      alert("Please enter the event details first.");
      return;
    }

    setLoading(true);
    setGeneratedEmail("");

    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventName,
          eventType,
          eventDate,
          description,
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to generate email."
        );
      }

      setGeneratedEmail(data.email);
    } catch (error) {
      console.error("AI generation error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate email."
      );
    } finally {
      setLoading(false);
    }
  }

  function continueToConfirmation() {
    if (!generatedEmail) {
      alert("Please generate the email first.");
      return;
    }

    localStorage.setItem("generatedEmail", generatedEmail);

    window.location.href = "/dashboard/send";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold">
              AI Email Generation
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Generate an employee event email using AI
            </p>
          </div>

          <button
            type="button"
            onClick={continueToConfirmation}
            disabled={!generatedEmail}
            className="rounded-lg bg-green-600 px-6 py-3 font-semibold transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to Email Confirmation
          </button>

        </div>
      </header>

      <section className="mx-auto max-w-6xl px-8 py-10">

        {/* Google Calendar */}
        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-8">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <span className="text-3xl">
                  📅
                </span>

                <h2 className="text-xl font-semibold">
                  Google Calendar
                </h2>

                {calendarConnected && (
                  <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs font-medium text-green-400">
                    Connected
                  </span>
                )}

              </div>

              <p className="mt-2 text-sm text-slate-400">
                Events are automatically detected and classified.
              </p>

            </div>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={connectGoogleCalendar}
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500"
              >
                {calendarConnected
                  ? "Reconnect Google Calendar"
                  : "Connect Google Calendar"}
              </button>

              <button
                type="button"
                onClick={loadCalendarEvents}
                disabled={calendarLoading}
                className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-3 font-semibold transition hover:bg-slate-700 disabled:opacity-50"
              >
                {calendarLoading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

            </div>

          </div>

          {/* Calendar Events */}
          <div className="mt-6">

            {calendarLoading ? (

              <div className="rounded-lg border border-slate-700 bg-slate-950 p-6 text-center text-slate-400">
                Loading Google Calendar events...
              </div>

            ) : !calendarConnected ? (

              <div className="rounded-lg border border-yellow-700/50 bg-yellow-950/20 p-6 text-center">

                <p className="text-yellow-400">
                  Google Calendar is not connected.
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Click "Connect Google Calendar" to connect your calendar.
                </p>

              </div>

            ) : calendarEvents.length === 0 ? (

              <div className="rounded-lg border border-slate-700 bg-slate-950 p-6 text-center">

                <p className="text-slate-300">
                  No upcoming Google Calendar events found.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Create an event in Google Calendar and click Refresh.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {calendarEvents.map((event) => {

                  const detectedType = detectEventType(
                    event.summary
                  );

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => selectCalendarEvent(event)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-5 text-left transition hover:border-blue-500 hover:bg-slate-900"
                    >

                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                        <div>

                          <div className="flex flex-wrap items-center gap-3">

                            <h3 className="font-semibold text-white">
                              {event.summary}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                detectedType === "Festival"
                                  ? "bg-purple-600/20 text-purple-400"
                                  : detectedType === "Birthday"
                                  ? "bg-pink-600/20 text-pink-400"
                                  : "bg-blue-600/20 text-blue-400"
                              }`}
                            >
                              {detectedType}
                            </span>

                          </div>

                          {event.description && (
                            <p className="mt-2 text-sm text-slate-400">
                              {event.description}
                            </p>
                          )}

                          {event.location && (
                            <p className="mt-1 text-sm text-slate-500">
                              📍 {event.location}
                            </p>
                          )}

                        </div>

                        <div className="text-sm text-blue-400">
                          {event.start
                            ? new Date(
                                event.start
                              ).toLocaleString()
                            : "Date not available"}
                        </div>

                      </div>

                    </button>
                  );
                })}

              </div>

            )}

          </div>

        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-2">

          {/* Event Information */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">

            <h2 className="text-xl font-semibold">
              Event Information
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Enter the information that will be used to create the email.
            </p>

            <div className="mt-8 space-y-5">

              {/* Event Name */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Event Name
                </label>

                <input
                  type="text"
                  value={eventName}
                  onChange={(e) =>
                    setEventName(e.target.value)
                  }
                  placeholder="Example: Annual Safety Toolbox Talk"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />

              </div>

              {/* Event Type */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Event Type
                </label>

                <select
                  value={eventType}
                  onChange={(e) =>
                    setEventType(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                >

                  <option value="Company Meeting">
                    Company Meeting
                  </option>

                  <option value="Training">
                    Training
                  </option>

                  <option value="Birthday">
                    Birthday
                  </option>

                  <option value="Work Anniversary">
                    Work Anniversary
                  </option>

                  <option value="Celebration">
                    Celebration
                  </option>

                  <option value="Festival">
                    Festival
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

              {/* Event Date */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Event Date
                </label>

                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) =>
                    setEventDate(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* Email Tone */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email Tone
                </label>

                <select
                  value={tone}
                  onChange={(e) =>
                    setTone(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                >

                  <option value="Professional">
                    Professional
                  </option>

                  <option value="Friendly">
                    Friendly
                  </option>

                  <option value="Formal">
                    Formal
                  </option>

                  <option value="Casual">
                    Casual
                  </option>

                </select>

              </div>

              {/* Event Description */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Event Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe the event, purpose, location, important instructions, etc."
                  rows={6}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />

              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={generateEmail}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Generating AI Email..."
                  : "Generate Email"}
              </button>

            </div>

          </div>

          {/* Generated Email */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-xl font-semibold">
                  Generated Email
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  AI-generated email content will appear here.
                </p>

              </div>

              <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-medium text-blue-400">
                AI
              </span>

            </div>

            {/* Email Preview */}
            <div className="mt-6 min-h-[430px] rounded-lg border border-slate-700 bg-slate-950 p-6">

              {generatedEmail ? (

                <textarea
                  value={generatedEmail}
                  onChange={(e) =>
                    setGeneratedEmail(e.target.value)
                  }
                  className="h-[400px] w-full resize-none bg-transparent text-sm leading-7 text-slate-200 outline-none"
                />

              ) : (

                <div className="flex h-[400px] items-center justify-center text-center">

                  <div>

                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/20 text-2xl">
                      ✨
                    </div>

                    <h3 className="font-semibold text-slate-300">
                      Ready to Generate
                    </h3>

                    <p className="mt-2 max-w-sm text-sm text-slate-500">
                      Select a Google Calendar event or enter the event
                      information manually, then click "Generate Email".
                    </p>

                  </div>

                </div>

              )}

            </div>

            {/* Continue Button */}
            <div className="mt-6 flex justify-end">

              <button
                type="button"
                onClick={continueToConfirmation}
                disabled={!generatedEmail}
                className="rounded-lg bg-green-600 px-6 py-3 font-semibold transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue to Email Confirmation
              </button>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}