"use client";

import { useState, useEffect } from "react";
import PageHeader from "../PageHeader";
import VoteButton from "../VoteButton";
import CommentSection from "../CommentSection";
import type { WildcardWithVotes } from "@/lib/types/database";

export default function WildcardsSection() {
  const [wildcards, setWildcards] = useState<WildcardWithVotes[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchWildcards();
  }, []);

  const fetchWildcards = async () => {
    try {
      const res = await fetch("/api/wildcards");
      const data = await res.json();
      setWildcards(data);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await fetch("/api/wildcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setShowForm(false);
        fetchWildcards();
      }
    } catch {
      // ignore
    }
  };

  return (
    <section id="wildcards" className="scroll-mt-20 py-16">
      <PageHeader title="EVENTS" subtitle="Trip ideas — vote for your favorites" color="cyan" />

      <div className="mb-6 text-center">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg border border-neon-cyan bg-neon-cyan/10 px-4 py-2 text-sm font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/20"
        >
          {showForm ? "Cancel" : "+ Submit an Idea"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-[var(--border)] bg-surface p-4">
          <input
            type="text"
            placeholder="Your idea *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mb-3 w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mb-3 w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
          />
          <button
            type="submit"
            className="rounded-lg bg-neon-cyan px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Submit
          </button>
        </form>
      )}

      <div className="space-y-3">
        {wildcards.map((w) => (
          <div
            key={w.id}
            className="rounded-xl border border-[var(--border)] bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">{w.title}</h3>
                {w.description && (
                  <p className="mt-1 text-sm text-gray-400">{w.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-600">
                  by {w.profile?.display_name ?? "Unknown"}
                </p>
              </div>
              <VoteButton
                entityId={w.id}
                initialCount={w.vote_count}
                initialVoted={w.user_voted}
                apiEndpoint="/api/wildcards"
              />
            </div>
            <CommentSection entityId={w.id} apiEndpoint="/api/wildcards" />
          </div>
        ))}
        {wildcards.length === 0 && (
          <p className="text-center text-sm text-gray-600">No ideas yet. Be the first!</p>
        )}
      </div>
    </section>
  );
}
