"use client";

import { useState } from "react";
import Link from "next/link";

export default function ReviewPage() {
  const [subject, setSubject] = useState(
    "Invitation - Annual Safety Toolbox Talk"
  );

  const [emailContent, setEmailContent] = useState(
    `Dear Team,

We are pleased to invite you to our upcoming Annual Safety Toolbox Talk.

Event: Annual Safety Toolbox Talk
Date: 03-10-2026

This session will focus on important workplace safety practices and awareness.

We request all selected employees to participate in the event and make it successful.

Your presence and participation are highly appreciated.

Best Regards,
HR & Administration Team`
  );

  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!subject.trim() || !emailContent.trim()) {
      alert("Please complete the email before saving.");
      return;
    }

    setSaved(true);
    alert("Email saved successfully!");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Review Email
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Review and edit the generated email before sending
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg bg-slate-700 px-5 py-2.5 font-medium hover:bg-slate-600"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-8 py-10">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Email Preview
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                You can edit the email before sending it.
              </p>
            </div>

            <span className="rounded-full bg-green-600/20 px-4 py-2 text-sm font-medium text-green-400">
              Ready for Review
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email Subject
              </label>

              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setSaved(false);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email Content
              </label>

              <textarea
                value={emailContent}
                onChange={(e) => {
                  setEmailContent(e.target.value);
                  setSaved(false);
                }}
                rows={18}
                className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-950 p-5">
              <h3 className="font-semibold">
                Email Summary
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">
                    Recipients
                  </p>

                  <p className="mt-1 font-medium text-blue-400">
                    Selected Employees
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Status
                  </p>

                  <p className="mt-1 font-medium text-green-400">
                    Draft Ready
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    AI Generation
                  </p>

                  <p className="mt-1 font-medium text-blue-400">
                    Completed
                  </p>
                </div>
              </div>
            </div>

            {saved && (
              <div className="rounded-lg border border-green-800 bg-green-900/20 px-5 py-4 text-sm text-green-400">
                ✓ Email has been saved successfully and is ready to send.
              </div>
            )}

            <div className="flex flex-col justify-between gap-3 pt-4 sm:flex-row">
              <Link
                href="/dashboard/ai-generation"
                className="rounded-lg bg-slate-700 px-6 py-3 text-center font-medium hover:bg-slate-600"
              >
                Back to AI Generation
              </Link>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
                >
                  Save Email
                </button>

                <Link
                  href="/dashboard/send"
                  className="rounded-lg bg-green-600 px-6 py-3 text-center font-semibold hover:bg-green-500"
                >
                  Continue to Send
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}