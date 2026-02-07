"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import PageHeader from "../PageHeader";
import type { RoomAllocation, Profile } from "@/lib/types/database";

const ROOM_ICONS: Record<string, string> = {
  "Master Bedroom": "👑",
  "Zjef Suite": "🎭",
  "Future Garden Suite": "🌿",
  "Cool and Quiet Suite": "🧊",
  "Theodors Suite": "🎩",
  "Gold's Gym Suite": "💪",
};

interface RoomsSectionProps {
  isAdmin: boolean;
}

export default function RoomsSection({ isAdmin }: RoomsSectionProps) {
  const [rooms, setRooms] = useState<RoomAllocation[]>([]);
  const [profiles, setProfiles] = useState<Pick<Profile, "id" | "display_name">[]>([]);

  useEffect(() => {
    fetchRooms();
    if (isAdmin) {
      fetch("/api/rooms/profiles")
        .then((r) => r.json())
        .then((data) => setProfiles(data))
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

  const handleAssign = async (roomId: string, userId: string | null) => {
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

            {isAdmin ? (
              <select
                value={room.user_id ?? ""}
                onChange={(e) =>
                  handleAssign(room.id, e.target.value || null)
                }
                className="w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-neon-purple"
              >
                <option value="">Unassigned</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                {room.profile?.avatar_url && (
                  <Image
                    src={room.profile.avatar_url}
                    alt={room.profile.display_name}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                )}
                <span className={`text-sm ${room.profile ? "text-neon-cyan" : "text-gray-600"}`}>
                  {room.profile?.display_name ?? "Unassigned"}
                </span>
              </div>
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
