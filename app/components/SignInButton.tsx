"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { guestLogin } from "@/app/actions/auth";

export default function SignInButton() {
  const [open, setOpen] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20"
      >
        Sign In
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg shadow-black/50">
          {/* Facebook login */}
          <button
            onClick={() => signIn("facebook", { callbackUrl: "/" })}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#166FE5]"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Sign in with Facebook
          </button>

          {/* Divider */}
          <div className="my-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs text-gray-500">or</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {/* Guest login form */}
          <form onSubmit={handleGuestLogin} className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="Your email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              required
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
            />
            <input
              type="password"
              placeholder="Site password"
              value={guestPassword}
              onChange={(e) => setGuestPassword(e.target.value)}
              required
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border border-neon-purple/50 bg-neon-purple/10 px-4 py-2 text-sm font-semibold text-neon-purple transition-all hover:bg-neon-purple/20 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Join as Guest"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
