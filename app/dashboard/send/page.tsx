"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Employee = {
  id: number;
  name: string;
  email: string;
  department: string | null;
  designation: string | null;
};

export default function SendEmailPage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [recipients, setRecipients] = useState<Employee[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  useEffect(() => {
    async function loadRecipients() {
      try {
        const savedIds = localStorage.getItem("selectedEmployeeIds");

        if (!savedIds) {
          throw new Error("No employees were selected.");
        }

        const selectedIds: number[] = JSON.parse(savedIds);

        const response = await fetch("/api/employees");

        if (!response.ok) {
          throw new Error("Failed to load employees.");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.message || "Failed to load employees."
          );
        }

        const selectedEmployees = data.employees.filter(
          (employee: Employee) =>
            selectedIds.includes(employee.id)
        );

        if (selectedEmployees.length === 0) {
          throw new Error(
            "No selected employees were found."
          );
        }

        setRecipients(selectedEmployees);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load selected employees."
        );
      } finally {
        setLoadingRecipients(false);
      }
    }

    loadRecipients();

    const savedEmail = localStorage.getItem("generatedEmail");

    if (savedEmail) {
      const lines = savedEmail.split("\n");

      const subjectLine = lines.find((line) =>
        line.startsWith("Subject:")
      );

      if (subjectLine) {
        setSubject(
          subjectLine.replace("Subject:", "").trim()
        );
      }

      const messageText = lines
        .filter((line) => !line.startsWith("Subject:"))
        .join("\n")
        .trim();

      setMessage(messageText);
    } else {
      setSubject("Employee Event Invitation");
      setMessage("No generated email found.");
    }
  }, []);

  async function handleSend() {
    if (!subject || !message) {
      alert("Email subject and message are required.");
      return;
    }

    if (recipients.length === 0) {
      alert("No employees selected.");
      return;
    }

    setSending(true);
    setError("");
    setSent(false);

    try {
      for (const employee of recipients) {
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: employee.email,
            subject,
            text: message,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              `Failed to send to ${employee.email}`
          );
        }
      }

      setSent(true);

      // Clear the selection after successful sending
      localStorage.removeItem("selectedEmployeeIds");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to send email."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Email Confirmation
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Confirm the email before sending it to employees
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

          <div className="mb-8">
            <h2 className="text-xl font-semibold">
              Confirm Email
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Review the recipients, subject, and message before sending.
            </p>
          </div>

          {/* Recipients */}
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Selected Recipients
              </h3>

              {!loadingRecipients && (
                <span className="rounded-full bg-blue-600/20 px-4 py-1.5 text-sm text-blue-400">
                  {recipients.length} selected
                </span>
              )}
            </div>

            {loadingRecipients && (
              <p className="mt-4 text-slate-400">
                Loading selected employees...
              </p>
            )}

            {!loadingRecipients && recipients.length > 0 && (
              <div className="mt-4 space-y-3">
                {recipients.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs">
                      ✓
                    </span>

                    <div>
                      <p className="font-medium text-white">
                        {employee.name}
                      </p>

                      <p className="text-sm text-slate-400">
                        {employee.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email Subject
            </label>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Message */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email Message
            </label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={16}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-lg border border-red-700 bg-red-900/20 px-5 py-4 text-red-400">
              ✕ {error}
            </div>
          )}

          {/* Success */}
          {sent && (
            <div className="mt-6 rounded-lg border border-green-700 bg-green-900/20 px-5 py-4 text-green-400">
              ✓ Email sent successfully to all selected employees.
            </div>
          )}

          {/* Buttons */}
          <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">

            <Link
              href="/dashboard/ai-generation"
              className="rounded-lg bg-slate-700 px-6 py-3 text-center font-medium hover:bg-slate-600"
            >
              Back to AI Generation
            </Link>

            <button
              type="button"
              onClick={handleSend}
              disabled={
                sending ||
                sent ||
                loadingRecipients ||
                recipients.length === 0
              }
              className="rounded-lg bg-green-600 px-8 py-3 font-semibold hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending
                ? "Sending Email..."
                : sent
                ? "Email Sent"
                : "Confirm & Send Email"}
            </button>

          </div>

          {sent && (
            <div className="mt-6 text-center">
              <Link
                href="/dashboard/status"
                className="text-blue-400 hover:text-blue-300"
              >
                View Email Status →
              </Link>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}