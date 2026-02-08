"use client";

import { useState } from "react";
import Image from "next/image";
import { guestLogin } from "@/app/actions/auth";

export default function LandingPage() {
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim() || !guestPassword) return;
    setLoading(true);
    setError("");

    const result = await guestLogin(guestEmail.trim(), guestPassword);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, the server action redirects to "/" automatically
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-neon-pink/5 blur-[128px]" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-neon-cyan/5 blur-[128px]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* Logo */}
        <Image
          src="/ibiza-logo.png"
          alt="Ibiza '26"
          width={280}
          height={280}
          priority
          className="drop-shadow-[0_0_40px_rgba(168,85,247,0.4)]"
        />

        {/* Tagline */}
        <p className="text-center text-sm text-gray-400">
          Sign in to access the trip planner
        </p>

        {/* Login card */}
        <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <form onSubmit={handleGuestLogin} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Your email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              required
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2.5 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
            />
            <input
              type="password"
              placeholder="Site password"
              value={guestPassword}
              onChange={(e) => setGuestPassword(e.target.value)}
              required
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2.5 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border border-neon-purple/50 bg-neon-purple/10 px-4 py-2.5 text-sm font-semibold text-neon-purple transition-all hover:bg-neon-purple/20 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Join as Guest"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <a
          href="/privacy"
          className="text-xs text-gray-600 transition-colors hover:text-gray-400"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
