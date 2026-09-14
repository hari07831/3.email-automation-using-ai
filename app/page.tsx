"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Application login credentials
    // This is NOT your Gmail password or Gmail App Password.
    if (
      email === "harikrishnan07831@gmail.com" &&
      password === "Admin@12345"
    ) {
      alert("Login successful!");
      window.location.href = "/dashboard";
    } else {
      alert("Invalid email or password");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md">

        {/* Project Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl">
            ✉️
          </div>

          <h1 className="text-3xl font-bold text-white">
            Employee Event
          </h1>

          <h2 className="text-2xl font-semibold text-blue-400">
            Email Automation
          </h2>

          <p className="mt-3 text-sm text-slate-400">
            AI-powered employee event communication system
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

          <h3 className="text-2xl font-semibold text-white">
            Admin Login
          </h3>

          <p className="mb-6 mt-2 text-sm text-slate-400">
            Sign in to manage employee events and emails.
          </p>

          <form onSubmit={handleLogin}>

            {/* Email */}
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              required
            />

            {/* Password */}
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-6 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              required
            />

            {/* Login Button */}
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              Login
            </button>

          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            AI-Powered Employee Event Email Automation System
          </p>

        </div>
      </div>
    </main>
  );
}