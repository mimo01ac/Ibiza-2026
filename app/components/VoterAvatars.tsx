"use client";

import { useState, useEffect } from "react";
import UserAvatar from "./UserAvatar";
import Modal from "./Modal";

interface Voter {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface VoterAvatarsProps {
  entityId: string;
  entityType: "events" | "wildcards";
  voteCount: number;
}

const MAX_SHOWN = 5;

export default function VoterAvatars({
  entityId,
  entityType,
  voteCount,
}: VoterAvatarsProps) {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (voteCount > 0) {
      fetch(`/api/${entityType}/${entityId}/voters`)
        .then((r) => r.json())
        .then((data) => setVoters(data.voters ?? []))
        .catch(() => {});
    } else {
      setVoters([]);
    }
  }, [entityId, entityType, voteCount]);

  if (voteCount === 0 || voters.length === 0) return null;

  const shown = voters.slice(0, MAX_SHOWN);
  const overflow = voters.length - MAX_SHOWN;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center -space-x-1.5 transition-opacity hover:opacity-80"
        title="See who voted"
      >
        {shown.map((v) => (
          <div key={v.id} className="ring-1 ring-background rounded-full">
            <UserAvatar src={v.avatar_url} name={v.display_name} size="xs" />
          </div>
        ))}
        {overflow > 0 && (
          <div className="flex h-5 items-center justify-center rounded-full bg-gray-800 px-1.5 text-[9px] font-semibold text-gray-400 ring-1 ring-background">
            +{overflow}
          </div>
        )}
      </button>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="w-80 rounded-xl border border-[var(--border)] bg-surface p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Voted ({voters.length})
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {voters.map((v) => (
              <div key={v.id} className="flex flex-col items-center gap-1">
                <UserAvatar src={v.avatar_url} name={v.display_name} size="lg" />
                <span className="text-center text-xs text-gray-400 leading-tight">
                  {v.display_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
