"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function DisplayNameModal() {
  const { update } = useSession();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.display_name_set === false) {
          setShow(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      await update();
      setShow(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-lg shadow-black/50">
        <h2 className="mb-1 text-lg font-bold text-foreground">Welcome!</h2>
        <p className="mb-4 text-sm text-gray-400">
          What should we call you?
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="rounded-lg border border-[var(--border)] bg-background px-3 py-2.5 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-lg border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2.5 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
