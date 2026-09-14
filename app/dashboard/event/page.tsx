"use client";

import { useState } from "react";
import Link from "next/link";

export default function EventPage() {
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  function handleContinue() {
    if (!eventName || !eventType || !eventDate || !eventDescription) {
      alert("Please fill in all event details.");
      return;
    }

    localStorage.setItem(
      "eventDetails",
      JSON.stringify({
        eventName,
        eventType,
        eventDate,
        eventDescription,
      })
    );

    window.location.href = "/dashboard/employees";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Create New Event
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Enter the details for your employee event
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg bg-slate-700 px-5 py-2.5 font-medium transition hover:bg-slate-600"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-8 py-10">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">

          <h2 className="text-xl font-semibold">
            Event Details
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            These details will be used to generate the event email.
          </p>

          <div className="mt-8 space-y-6">

            {/* Event Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Event Name
              </label>

              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Example: Annual Company Meeting"
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
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="">
                  Select event type
                </option>

                <option value="Birthday">
                  Birthday
                </option>

                <option value="Work Anniversary">
                  Work Anniversary
                </option>

                <option value="Company Meeting">
                  Company Meeting
                </option>

                <option value="Training">
                  Training
                </option>

                <option value="Celebration">
                  Celebration
                </option>

                <option value="Safety Event">
                  Safety Event
                </option>

                <option value="Announcement">
                  Announcement
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
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Event Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Event Description
              </label>

              <textarea
                value={eventDescription}
                onChange={(e) =>
                  setEventDescription(e.target.value)
                }
                placeholder="Enter the event details..."
                rows={7}
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-between gap-3 pt-4">

              <Link
                href="/dashboard"
                className="rounded-lg bg-slate-700 px-6 py-3 font-medium transition hover:bg-slate-600"
              >
                Back
              </Link>

              <button
                type="button"
                onClick={handleContinue}
                className="rounded-lg bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-500"
              >
                Continue to Employees
              </button>

            </div>

          </div>
        </div>
      </section>
    </main>
  );
}