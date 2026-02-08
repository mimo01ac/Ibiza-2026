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
      .then((data) => setIsConfirmed(data.is_confirmed ?? false))
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
    <div className="relative z-10 mx-auto mb-16 max-w-4xl text-center">
      {/* Section divider */}
      <div className="mb-8 flex items-center justify-center gap-4">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-neon-purple/50" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-neon-purple">
          Confirmed Participants
        </h2>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-neon-purple/50" />
      </div>

      {/* Avatar grid */}
      {participants.length > 0 ? (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-6">
          {participants.map((p) => (
            <div key={p.id} className="group relative flex flex-col items-center gap-2">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-neon-pink/50 shadow-[0_0_15px_rgba(255,16,240,0.2)]">
                {p.avatar_url ? (
                  <Image
                    src={p.avatar_url}
                    alt={p.display_name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-800 text-lg font-bold text-neon-pink">
                    {p.display_name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Admin delete overlay */}
                {isAdmin && (
                  <button
                    onClick={() => handleAdminRemove(p.id, p.display_name)}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                    title={`Remove ${p.display_name}`}
                  >
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <span className="max-w-[80px] truncate text-xs text-gray-400">
                {p.display_name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-8 text-sm text-gray-500">
          No one has confirmed yet. Be the first!
        </p>
      )}

      {/* Toggle button */}
      {session?.user && (
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-wider transition-all ${
            isConfirmed
              ? "border border-neon-pink/50 bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20"
              : "border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20"
          } ${loading ? "opacity-50" : ""}`}
        >
          {loading ? "..." : isConfirmed ? "I'm out" : "I'm in!"}
        </button>
      )}
    </div>
  );
}
