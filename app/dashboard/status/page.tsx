"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type EmailStatus = {
  id: number;
  name: string;
  email: string;
  subject: string;
  status: string;
  sentAt: string | null;
};

export default function StatusPage() {
  const [emailStatus, setEmailStatus] = useState<EmailStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEmailStatus() {
      try {
        const response = await fetch("/api/email-status");

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to fetch email status."
          );
        }

        setEmailStatus(data.emailLogs);
      } catch (error) {
        console.error("Status loading error:", error);
        setError("Failed to load email status.");
      } finally {
        setLoading(false);
      }
    }

    fetchEmailStatus();
  }, []);

  const sentCount = emailStatus.filter(
    (employee) => employee.status === "Sent"
  ).length;

  const pendingCount = emailStatus.filter(
    (employee) => employee.status === "Pending"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Email Status
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Track the status of employee event emails
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

      <section className="mx-auto max-w-6xl px-8 py-10">
        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="text-slate-400">
              Loading email status...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-800 bg-red-950/40 p-6 text-red-400">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-sm text-slate-400">
                  Total Emails
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {emailStatus.length}
                </p>
              </div>

              <div className="rounded-xl border border-green-900 bg-slate-900 p-6">
                <p className="text-sm text-slate-400">
                  Emails Sent
                </p>

                <p className="mt-2 text-3xl font-bold text-green-400">
                  {sentCount}
                </p>
              </div>

              <div className="rounded-xl border border-yellow-900 bg-slate-900 p-6">
                <p className="text-sm text-slate-400">
                  Pending
                </p>

                <p className="mt-2 text-3xl font-bold text-yellow-400">
                  {pendingCount}
                </p>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-6 py-5">
                <h2 className="text-xl font-semibold">
                  Email Delivery Status
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Real-time email records from MySQL
                </p>
              </div>

              <div className="overflow-x-auto">
                {emailStatus.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">
                    No emails have been sent yet.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/60 text-left">
                        <th className="px-6 py-4 text-sm font-semibold">
                          Employee
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold">
                          Email
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold">
                          Subject
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold">
                          Status
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold">
                          Sent At
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {emailStatus.map((employee) => (
                        <tr
                          key={employee.id}
                          className="border-b border-slate-800 last:border-0"
                        >
                          <td className="px-6 py-5 font-medium">
                            {employee.name}
                          </td>

                          <td className="px-6 py-5 text-slate-400">
                            {employee.email}
                          </td>

                          <td className="max-w-xs px-6 py-5 text-slate-300">
                            {employee.subject}
                          </td>

                          <td className="px-6 py-5">
                            {employee.status === "Sent" ? (
                              <span className="inline-flex rounded-full bg-green-600/20 px-4 py-1.5 text-sm font-medium text-green-400">
                                ✓ Sent
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-yellow-600/20 px-4 py-1.5 text-sm font-medium text-yellow-400">
                                ● Pending
                              </span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-400">
                            {employee.sentAt
                              ? new Date(
                                  employee.sentAt
                                ).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <Link
                href="/dashboard/send"
                className="rounded-lg bg-slate-700 px-6 py-3 font-medium hover:bg-slate-600"
              >
                Back to Send
              </Link>

              <Link
                href="/dashboard"
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
              >
                Finish Workflow
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}