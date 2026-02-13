"use client";

import { useState, useEffect } from "react";
import PageHeader from "../PageHeader";
import UserAvatar from "../UserAvatar";
import type { Profile } from "@/lib/types/database";

const ROOM_ICONS: Record<string, string> = {
  "Master Bedroom": "👑",
  "Zjef Suite": "🎭",
  "Future Garden Suite": "🌿",
  "Cool and Quiet Suite": "🧊",
  "Theodors Suite": "🎩",
  "Gold's Gym Suite": "💪",
};

interface RoomData {
  id: string;
  room_name: string;
  description: string | null;
  profiles: Pick<Profile, "id" | "display_name" | "avatar_url">[];
}

interface RoomsSectionProps {
  isAdmin: boolean;
}

export default function RoomsSection({ isAdmin }: RoomsSectionProps) {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [allProfiles, setAllProfiles] = useState<Pick<Profile, "id" | "display_name">[]>([]);

  useEffect(() => {
    fetchRooms();
    if (isAdmin) {
      fetch("/api/rooms/profiles")
        .then((r) => r.json())
        .then((data) => setAllProfiles(data))
        .catch(() => {});
    }
  }, [isAdmin]);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      setRooms(data);
    } catch {
      // ignore
    }
  };

  const handleAdd = async (roomId: string, userId: string) => {
    if (!userId) return;
    try {
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, user_id: userId }),
      });
      fetchRooms();
    } catch {
      // ignore
    }
  };

  const handleRemove = async (roomId: string, userId: string) => {
    try {
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, user_id: userId, action: "remove" }),
      });
      fetchRooms();
    } catch {
      // ignore
    }
  };

  // Users already assigned to any room
  const assignedUserIds = new Set(rooms.flatMap((r) => r.profiles.map((p) => p.id)));

  if (!isAdmin) return null;

  return (
    <section id="rooms" className="scroll-mt-20 py-16">
      <PageHeader title="ROOM ALLOCATION" subtitle="Who sleeps where?" color="purple" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="rounded-xl border border-[var(--border)] bg-surface p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">{ROOM_ICONS[room.room_name] ?? "🛏️"}</span>
              <h3 className="font-semibold text-foreground">{room.room_name}</h3>
            </div>

            {room.description && (
              <p className="mb-3 text-xs text-gray-500">{room.description}</p>
            )}

            {/* Occupants list */}
            <div className="space-y-2">
              {room.profiles.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <UserAvatar
                    src={p.avatar_url}
                    name={p.display_name}
                    size="sm"
                  />
                  <span className="flex-1 text-sm text-neon-cyan">{p.display_name}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemove(room.id, p.id)}
                      className="rounded p-1 text-gray-600 transition-colors hover:text-neon-pink"
                      title="Remove"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {room.profiles.length === 0 && (
                <span className="text-sm text-gray-600">Unassigned</span>
              )}
            </div>

            {/* Admin: add user dropdown */}
            {isAdmin && (
              <select
                value=""
                onChange={(e) => handleAdd(room.id, e.target.value)}
                className="mt-3 w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-neon-purple"
              >
                <option value="">+ Add person...</option>
                {allProfiles
                  .filter((p) => !assignedUserIds.has(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}
                    </option>
                  ))}
              </select>
            )}
          </div>
        ))}

        {rooms.length === 0 && (
          <p className="col-span-full text-center text-sm text-gray-600">
            No rooms configured yet.
          </p>
        )}
      </div>
    </section>
  );
}
