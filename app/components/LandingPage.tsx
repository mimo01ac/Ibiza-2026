"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function LandingPage() {
  const [guestName, setGuestName] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPassword) return;
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      name: guestName.trim(),
      password: guestPassword,
      redirect: false,
    });

    if (result?.error) {
      setError("Wrong password or missing name");
      setLoading(false);
    } else {
      window.location.href = "/";
    }
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
          {/* Facebook login */}
          <button
            onClick={() => signIn("facebook")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#166FE5] hover:shadow-lg hover:shadow-[#1877F2]/25"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Sign in with Facebook
          </button>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs text-gray-500">or</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {/* Guest login form */}
          <form onSubmit={handleGuestLogin} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
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
