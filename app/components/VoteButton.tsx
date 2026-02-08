"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "./Toast";

interface VoteButtonProps {
  entityId: string;
  initialCount: number;
  initialVoted: boolean;
  apiEndpoint: string;
  onVoteChange?: (count: number, voted: boolean) => void;
}

export default function VoteButton({
  entityId,
  initialCount,
  initialVoted,
  apiEndpoint,
  onVoteChange,
}: VoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const toast = useToast();
  const prevCount = useRef(initialCount);

  useEffect(() => {
    if (count !== prevCount.current) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 300);
      prevCount.current = count;
      return () => clearTimeout(timer);
    }
  }, [count]);

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
        toast.error("Vote failed");
      } else {
        const data = await res.json();
        setCount(data.vote_count);
        setVoted(data.user_voted);
        onVoteChange?.(data.vote_count, data.user_voted);
      }
    } catch {
      setVoted(voted);
      setCount(count);
      toast.error("Vote failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all ${
        voted
          ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan neon-glow-cyan"
          : "border-[var(--border)] text-gray-400 hover:border-neon-cyan/50 hover:text-neon-cyan/70 hover:shadow-[0_0_8px_rgba(0,240,255,0.15)]"
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
      <span className={animating ? "vote-pulse" : ""}>{count}</span>
    </button>
  );
}
