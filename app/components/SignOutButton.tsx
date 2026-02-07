"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-neon-pink hover:text-neon-pink"
    >
      Sign Out
    </button>
  );
}
