"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Comment } from "@/lib/types/database";

interface CommentSectionProps {
  entityId: string;
  apiEndpoint: string;
}

export default function CommentSection({
  entityId,
  apiEndpoint,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) {
      fetch(`${apiEndpoint}/${entityId}/comments`)
        .then((r) => r.json())
        .then((data) => setComments(data))
        .catch(() => {});
    }
  }, [expanded, entityId, apiEndpoint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiEndpoint}/${entityId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-gray-500 hover:text-neon-cyan transition-colors"
      >
        {expanded ? "Hide comments" : `Comments (${comments.length || "..."})`}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 rounded-lg bg-background p-2">
              {c.profile?.avatar_url && (
                <Image
                  src={c.profile.avatar_url}
                  alt={c.profile.display_name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-neon-cyan">
                  {c.profile?.display_name ?? "User"}
                </span>
                <p className="text-sm text-gray-300">{c.content}</p>
              </div>
            </div>
          ))}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg border border-[var(--border)] bg-background px-3 py-1.5 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="rounded-lg bg-neon-cyan/10 px-3 py-1.5 text-sm font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/20 disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
