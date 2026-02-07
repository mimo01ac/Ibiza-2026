"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import PageHeader from "../PageHeader";
import Modal from "../Modal";

interface Track {
  name: string;
  url: string;
}

const GALLERY_PHOTOS = ["/dj/studio.webp"];

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
  const [introPlayed, setIntroPlayed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const spotifyRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch("/api/dj-media")
      .then((r) => r.json())
      .then((data) => {
        setPhotos(data.photos ?? []);
        setTracks(data.tracks ?? []);
      })
      .catch(() => {});
  }, []);

  // Autoplay dicosis-intro.mp3 once on first load
  useEffect(() => {
    if (introPlayed || tracks.length === 0) return;
    const introIndex = tracks.findIndex((t) =>
      t.name.toLowerCase().includes("dicosis-intro")
    );
    if (introIndex === -1) return;
    setIntroPlayed(true);
    setCurrentTrack(introIndex);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = tracks[introIndex].url;
      audioRef.current.play().catch(() => {
        // Browser may block autoplay without user gesture
        setIsPlaying(false);
      });
    }
  }, [tracks, introPlayed]);

  // Pause local audio when Spotify iframe gains focus
  useEffect(() => {
    const handleBlur = () => {
      if (
        document.activeElement === spotifyRef.current &&
        isPlaying &&
        audioRef.current
      ) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [isPlaying]);

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
      <PageHeader title="VILLA DJ" subtitle="Beats to fuel the trip" color="purple" />

      {/* Artist bio */}
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-surface p-6">
        <h3 className="mb-2 text-lg font-bold text-white">Lars Vinter</h3>
        <p className="text-sm leading-relaxed text-gray-400">
          Lars Vinter is the man behind the decks. As one half of the trance
          duo Dicosis, he is the guy ensuring the right beats and juicy tones
          in the villa all week.
        </p>
        <a
          href="https://dicosismusic.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-neon-purple/50 bg-neon-purple/10 px-5 py-2 text-sm font-semibold text-neon-purple transition-colors hover:bg-neon-purple/20"
        >
          Visit Official Dicosis Website
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>

      {/* Two photos side by side: Lars 1/3 (left) + Studio 2/3 (right) */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <button
          onClick={() => setSelectedPhoto("/dj/lars-vinter.png")}
          className="group relative overflow-hidden rounded-xl border border-[var(--border)]"
        >
          <Image
            src="/dj/lars-vinter.png"
            alt="Lars Vinter"
            width={400}
            height={700}
            className="h-full w-full object-contain transition-transform group-hover:scale-105"
          />
        </button>
        <div className="col-span-2 flex flex-col gap-4">
          <button
            onClick={() => setSelectedPhoto("/dj/studio.webp")}
            className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--border)]"
          >
            <Image
              src="/dj/studio.webp"
              alt="Dicosis Studio"
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </button>
          {/* Spotify embed below studio photo */}
          <div className="overflow-hidden rounded-xl">
            <iframe
              ref={spotifyRef}
              src="https://open.spotify.com/embed/artist/1OzaVbvTssplYwiAq5xq2V?utm_source=generator&theme=0"
              width="100%"
              height="152"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
              title="Dicosis on Spotify"
            />
          </div>
        </div>
      </div>

      {/* Uploaded photos gallery */}
      {photos.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-surface p-4">
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
