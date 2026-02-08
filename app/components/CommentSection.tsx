"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "./Toast";
import UserAvatar from "./UserAvatar";
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
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const { data: session } = useSession();
  const toast = useToast();

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

  const handleDelete = async (commentId: string) => {
    // Optimistic removal
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== commentId));

    try {
      const res = await fetch(`${apiEndpoint}/${entityId}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      if (!res.ok) {
        setComments(prev);
        toast.error("Failed to delete comment");
      }
    } catch {
      setComments(prev);
      toast.error("Failed to delete comment");
    }
  };

  const handleLike = async (commentId: string) => {
    const current = likes[commentId] ?? { count: 0, liked: false };
    // Optimistic
    setLikes((prev) => ({
      ...prev,
      [commentId]: {
        count: current.liked ? current.count - 1 : current.count + 1,
        liked: !current.liked,
      },
    }));

    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setLikes((prev) => ({
          ...prev,
          [commentId]: { count: data.like_count, liked: data.user_liked },
        }));
      } else {
        // Revert
        setLikes((prev) => ({ ...prev, [commentId]: current }));
      }
    } catch {
      setLikes((prev) => ({ ...prev, [commentId]: current }));
    }
  };

  const isOwnComment = (c: Comment) =>
    session?.user?.email && c.profile?.auth_user_email === session.user.email;

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
          {comments.map((c) => {
            const likeData = likes[c.id] ?? { count: 0, liked: false };
            return (
              <div key={c.id} className="flex items-start gap-2 rounded-lg bg-background p-2">
                <UserAvatar
                  src={c.profile?.avatar_url}
                  name={c.profile?.display_name ?? "User"}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-neon-cyan">
                    {c.profile?.display_name ?? "User"}
                  </span>
                  <p className="text-sm text-gray-300">{c.content}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      onClick={() => handleLike(c.id)}
                      className={`flex items-center gap-1 text-[10px] transition-colors ${
                        likeData.liked
                          ? "text-neon-pink"
                          : "text-gray-600 hover:text-neon-pink"
                      }`}
                    >
                      <svg
                        className="h-3 w-3"
                        fill={likeData.liked ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      {likeData.count > 0 && <span>{likeData.count}</span>}
                    </button>
                  </div>
                </div>
                {isOwnComment(c) && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="shrink-0 rounded p-1 text-gray-600 transition-colors hover:text-red-400"
                    title="Delete comment"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

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
