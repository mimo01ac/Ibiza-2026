"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import PageHeader from "../PageHeader";
import Modal from "../Modal";

interface Track {
  name: string;
  url: string;
}

interface DjSectionProps {
  isAdmin: boolean;
}

export default function DjSection({ isAdmin }: DjSectionProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch("/api/dj-media")
      .then((r) => r.json())
      .then((data) => {
        setPhotos(data.photos ?? []);
        setTracks(data.tracks ?? []);
      })
      .catch(() => {});
  }, []);

  const playTrack = (index: number) => {
    if (currentTrack === index && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      setCurrentTrack(index);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = tracks[index].url;
        audioRef.current.play();
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await fetch("/api/dj-media/upload", { method: "POST", body: fd });
      // Refresh media
      const res = await fetch("/api/dj-media");
      const data = await res.json();
      setPhotos(data.photos ?? []);
      setTracks(data.tracks ?? []);
    } catch {
      // ignore
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <section id="dj" className="scroll-mt-20 py-16">
      <PageHeader title="DJ DICOSIS" subtitle="Beats to fuel the trip" color="purple" />

      {isAdmin && (
        <div className="mb-6 text-center">
          <label className="cursor-pointer rounded-lg border border-neon-purple bg-neon-purple/10 px-4 py-2 text-sm font-semibold text-neon-purple transition-colors hover:bg-neon-purple/20">
            {uploading ? "Uploading..." : "Upload Media"}
            <input
              type="file"
              className="hidden"
              accept="image/*,audio/*"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelectedPhoto(url)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--border)]"
            >
              <Image
                src={url}
                alt={`DJ photo ${i + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {/* Audio player */}
      {tracks.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Tracks
          </h3>
          <div className="space-y-1">
            {tracks.map((track, i) => (
              <button
                key={i}
                onClick={() => playTrack(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  currentTrack === i
                    ? "bg-neon-purple/10 text-neon-purple"
                    : "text-gray-400 hover:bg-surface hover:text-neon-cyan"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current">
                  {currentTrack === i && isPlaying ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </span>
                <span className="truncate">{track.name}</span>
              </button>
            ))}
          </div>
          <audio
            ref={audioRef}
            onEnded={() => {
              if (currentTrack !== null && currentTrack < tracks.length - 1) {
                playTrack(currentTrack + 1);
              } else {
                setIsPlaying(false);
              }
            }}
          />
        </div>
      )}

      <Modal open={!!selectedPhoto} onClose={() => setSelectedPhoto(null)}>
        {selectedPhoto && (
          <Image
            src={selectedPhoto}
            alt="DJ photo"
            width={1200}
            height={800}
            className="rounded-lg"
          />
        )}
      </Modal>
    </section>
  );
}
