"use client";

import { useState, useRef, useEffect } from "react";
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
