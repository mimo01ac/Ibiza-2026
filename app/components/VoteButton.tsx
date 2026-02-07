"use client";

import { useState } from "react";

interface VoteButtonProps {
  entityId: string;
  initialCount: number;
  initialVoted: boolean;
  apiEndpoint: string;
}

export default function VoteButton({
  entityId,
  initialCount,
  initialVoted,
  apiEndpoint,
}: VoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (loading) return;
    setLoading(true);
    // Optimistic update
    setVoted(!voted);
    setCount(voted ? count - 1 : count + 1);

    try {
      const res = await fetch(`${apiEndpoint}/${entityId}/vote`, {
        method: "POST",
      });
      if (!res.ok) {
        // Revert on failure
        setVoted(voted);
        setCount(count);
      } else {
        const data = await res.json();
        setCount(data.vote_count);
        setVoted(data.user_voted);
      }
    } catch {
      setVoted(voted);
      setCount(count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all ${
        voted
          ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan neon-glow-cyan"
          : "border-[var(--border)] text-gray-400 hover:border-neon-cyan hover:text-neon-cyan"
      }`}
    >
      <svg className="h-4 w-4" fill={voted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
      {count}
    </button>
  );
}
