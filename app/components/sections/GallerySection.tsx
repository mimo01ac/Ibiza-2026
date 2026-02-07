"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import PageHeader from "../PageHeader";
import Modal from "../Modal";
import type { GalleryPhoto } from "@/lib/types/database";

const CATEGORIES = [
  { key: "past_trips", label: "Past Trips" },
  { key: "ibiza_2026", label: "Ibiza 2026" },
] as const;

export default function GallerySection() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [category, setCategory] = useState<string>("past_trips");
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    fetchPhotos();
  }, [category]);

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/gallery?category=${category}`);
      const data = await res.json();
      setPhotos(data);
    } catch {
      // ignore
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    if (caption.trim()) fd.append("caption", caption.trim());
    try {
      const res = await fetch("/api/gallery", { method: "POST", body: fd });
      if (res.ok) {
        setCaption("");
        fetchPhotos();
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error || `Upload failed (${res.status})`);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/gallery/${id}`, { method: "DELETE" });
      setSelectedPhoto(null);
      fetchPhotos();
    } catch {
      // ignore
    }
  };

  return (
    <section id="gallery" className="scroll-mt-20 py-16">
      <PageHeader title="GALLERY" subtitle="Memories from past trips and this one" color="pink" />

      {/* Category tabs + upload */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <div className="flex rounded-lg border border-[var(--border)]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                category === cat.key
                  ? "bg-neon-pink/20 text-neon-pink"
                  : "text-gray-500 hover:text-neon-pink"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-pink"
          />
          <label className="cursor-pointer rounded-lg border border-neon-pink bg-neon-pink/10 px-4 py-2 text-sm font-semibold text-neon-pink transition-colors hover:bg-neon-pink/20">
            {uploading ? "Uploading..." : "Upload"}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {uploadError && (
        <p className="mb-4 text-center text-xs text-red-400">{uploadError}</p>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--border)]"
          >
            <Image
              src={photo.file_url}
              alt={photo.caption ?? "Gallery photo"}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="truncate text-xs text-gray-200">{photo.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {photos.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-600">No photos yet. Upload the first!</p>
      )}

      {/* Lightbox */}
      <Modal open={!!selectedPhoto} onClose={() => setSelectedPhoto(null)}>
        {selectedPhoto && (
          <div>
            <Image
              src={selectedPhoto.file_url}
              alt={selectedPhoto.caption ?? "Gallery photo"}
              width={1200}
              height={800}
              className="rounded-lg"
            />
            <div className="mt-3 flex items-center justify-between">
              <div>
                {selectedPhoto.caption && (
                  <p className="text-sm text-gray-300">{selectedPhoto.caption}</p>
                )}
                <p className="text-xs text-gray-600">
                  by {selectedPhoto.profile?.display_name ?? "Unknown"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(selectedPhoto.id)}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
