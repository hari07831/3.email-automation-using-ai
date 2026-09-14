"use client";

import Link from "next/link";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Employee Event Email Automation
            </h1>

            <p className="text-sm text-slate-400">
              AI-powered employee communication system
            </p>
          </div>

          <div className="rounded-lg bg-slate-800 px-4 py-2">
            <p className="text-xs text-slate-400">
              Logged in as
            </p>

            <p className="font-medium">
              Administrator
            </p>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <section className="mx-auto max-w-6xl px-8 py-16">
        <div className="mb-10">
          <h2 className="text-4xl font-bold">
            Admin Dashboard
          </h2>

          <p className="mt-3 text-lg text-slate-400">
            Create employee events and manage automated email communication.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-8 md:grid-cols-2">

          {/* Create New Event */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-950 text-5xl">
              📅
            </div>

            <h3 className="text-3xl font-bold">
              Create New Event
            </h3>

            <p className="mt-4 text-lg leading-8 text-slate-400">
              Create a birthday, company meeting, training, celebration,
              announcement, safety event, or other employee event.
            </p>

            <Link
              href="/dashboard/employees"
              className="mt-8 block w-full rounded-lg bg-blue-600 py-4 text-center text-lg font-semibold transition hover:bg-blue-500"
            >
              Create New Event
            </Link>
          </div>

          {/* Email Status */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-950 text-5xl">
              📊
            </div>

            <h3 className="text-3xl font-bold">
              Email Status
            </h3>

            <p className="mt-4 text-lg leading-8 text-slate-400">
              View email delivery records, recipients, subjects, sending
              status, and sent time from the MySQL database.
            </p>

            <Link
              href="/dashboard/status"
              className="mt-8 block w-full rounded-lg bg-green-600 py-4 text-center text-lg font-semibold transition hover:bg-green-500"
            >
              View Email Status
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}