"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useToast } from "./Toast";

interface Participant {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface ConfirmedParticipantsProps {
  isAdmin: boolean;
}

export default function ConfirmedParticipants({ isAdmin }: ConfirmedParticipantsProps) {
  const { data: session } = useSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch("/api/participants");
      const data = await res.json();
      setParticipants(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Check if current user is confirmed
  useEffect(() => {
    if (!session?.user?.email) {
      setIsConfirmed(false);
      return;
    }
    fetch("/api/participants/confirm")
      .then((r) => r.json())
      .then((data) => {
        setIsConfirmed(data.is_confirmed ?? false);
        setMyProfileId(data.profile_id ?? null);
      })
      .catch(() => setIsConfirmed(false));
  }, [session?.user?.email]);

  const handleToggle = async () => {
    if (!session?.user?.email || loading) return;
    setLoading(true);

    const wasConfirmed = isConfirmed;
    setIsConfirmed(!wasConfirmed);

    try {
      const res = await fetch("/api/participants/confirm", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsConfirmed(data.is_confirmed);
        await fetchParticipants();
      } else {
        setIsConfirmed(wasConfirmed);
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      setIsConfirmed(wasConfirmed);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRemove = async (profileId: string, name: string) => {
    try {
      const res = await fetch("/api/participants/confirm", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      if (res.ok) {
        await fetchParticipants();
        toast.success(`${name} removed`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove participant");
      }
    } catch {
      toast.error("Failed to remove participant");
    }
  };

  return (
    <section className="relative z-10 mx-auto max-w-4xl py-16 text-center">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-neon-purple text-glow-purple sm:text-4xl">
          CONFIRMED
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Who&apos;s in for the trip of a lifetime?
        </p>
        <div className="mx-auto mt-4 h-px w-32 bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
      </div>

      {/* Avatar grid */}
      {participants.length > 0 ? (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-6">
          {participants.map((p) => {
            const isMe = session?.user?.email && myProfileId === p.id;
            return (
              <div key={p.id} className="group relative flex flex-col items-center gap-2">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-neon-pink/50 shadow-[0_0_15px_rgba(255,16,240,0.2)]">
                  {p.avatar_url ? (
                    <Image
                      src={p.avatar_url}
                      alt={p.display_name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-800 text-lg font-bold text-neon-pink">
                      {p.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* "I'm out" overlay on own avatar — visible on hover (desktop) or tap (mobile) */}
                  {isMe && isConfirmed && (
                    <button
                      onClick={handleToggle}
                      disabled={loading}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/70 text-[10px] font-semibold uppercase tracking-wide text-neon-pink opacity-0 transition-opacity group-hover:opacity-100 active:opacity-100"
                    >
                      {loading ? "..." : "I'm out"}
                    </button>
                  )}
                </div>

                {/* Admin delete badge — always visible, works on mobile */}
                {isAdmin && (
                  <button
                    onClick={() => handleAdminRemove(p.id, p.display_name)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/90 text-white shadow-md transition-transform hover:scale-110"
                    title={`Remove ${p.display_name}`}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                <span className="max-w-[80px] truncate text-xs text-gray-400">
                  {p.display_name}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mb-8 text-sm text-gray-500">
          No one has confirmed yet. Be the first!
        </p>
      )}

      {/* "I'm in!" button — only shown when not yet confirmed */}
      {session?.user && !isConfirmed && (
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-wider transition-all border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 ${
            loading ? "opacity-50" : ""
          }`}
        >
          {loading ? "..." : "I'm in!"}
        </button>
      )}
    </section>
  );
}
