"use client";

import { useState, useEffect } from "react";
import PageHeader from "../PageHeader";
import VoteButton from "../VoteButton";
import VoterAvatars from "../VoterAvatars";
import CommentSection from "../CommentSection";
import type { WildcardWithVotes } from "@/lib/types/database";

export default function WildcardsSection() {
  const [wildcards, setWildcards] = useState<WildcardWithVotes[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
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

      {(() => {
        const sorted = [...wildcards].sort((a, b) => b.vote_count - a.vote_count);
        const DESKTOP_DEFAULT = 8;
        const MOBILE_DEFAULT = 2;
        const desktopHidden = sorted.length - DESKTOP_DEFAULT;
        const mobileHidden = sorted.length - MOBILE_DEFAULT;

        return (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {sorted.map((w, idx) => (
                <div
                  key={w.id}
                  className={`rounded-xl border border-[var(--border)] bg-surface p-3 ${
                    idx === 0 && w.vote_count > 0
                      ? "border-neon-cyan/40 bg-neon-cyan/5"
                      : ""
                  } ${idx >= MOBILE_DEFAULT && !expanded ? "hidden md:block" : ""} ${
                    idx >= DESKTOP_DEFAULT && !expanded ? "md:hidden" : ""
                  }`}
                >
                  {idx === 0 && w.vote_count > 0 && (
                    <span className="mb-1 inline-block text-xs text-neon-cyan">★ Top pick</span>
                  )}
                  <h3 className="text-sm font-semibold text-foreground">{w.title}</h3>
                  {w.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-400">{w.description}</p>
                  )}
                  <p className="mt-1 text-[10px] text-gray-600">
                    by {w.profile?.display_name ?? "Unknown"}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <VoteButton
                      entityId={w.id}
                      initialCount={w.vote_count}
                      initialVoted={w.user_voted}
                      apiEndpoint="/api/wildcards"
                      onVoteChange={(count) =>
                        setVoteCounts((prev) => ({ ...prev, [w.id]: count }))
                      }
                    />
                    <VoterAvatars
                      entityId={w.id}
                      entityType="wildcards"
                      voteCount={voteCounts[w.id] ?? w.vote_count}
                    />
                  </div>
                  <CommentSection entityId={w.id} apiEndpoint="/api/wildcards" />
                </div>
              ))}
            </div>

            {/* Desktop expand (>8) */}
            {desktopHidden > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-3 hidden w-full rounded-lg border border-[var(--border)] py-2 text-center text-sm text-gray-400 transition-colors hover:text-neon-cyan md:block"
              >
                {expanded ? "Show less" : `Show ${desktopHidden} more ideas`}
              </button>
            )}

            {/* Mobile expand (>2) */}
            {mobileHidden > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-3 w-full rounded-lg border border-[var(--border)] py-2 text-center text-sm text-gray-400 transition-colors hover:text-neon-cyan md:hidden"
              >
                {expanded ? "Show less" : `Show ${mobileHidden} more ideas`}
              </button>
            )}

            {wildcards.length === 0 && (
              <p className="text-center text-sm text-gray-600">No ideas yet. Be the first!</p>
            )}
          </>
        );
      })()}
    </section>
  );
}
