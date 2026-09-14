"use client";

import { useState } from "react";

export default function AIGenerationPage() {
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Company Meeting");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [loading, setLoading] = useState(false);

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

      {/* Main Content */}
      <section className="mx-auto max-w-6xl px-8 py-10">

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
                  onChange={(e) => setEventName(e.target.value)}
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
                  onChange={(e) => setEventType(e.target.value)}
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

              {/* Email Tone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email Tone
                </label>

                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
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
                  onChange={(e) => setDescription(e.target.value)}
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
                      Enter the event information and click
                      &quot;Generate Email&quot; to create your
                      personalized employee event email.
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