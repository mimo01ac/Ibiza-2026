"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import PageHeader from "../PageHeader";
import Modal from "../Modal";
import { useToast } from "../Toast";
import type { GalleryPhoto } from "@/lib/types/database";

const CATEGORIES = [
  { key: "past_trips", label: "Past Trips" },
  { key: "ibiza_2026", label: "Ibiza 2026" },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function GallerySection() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [category, setCategory] = useState<string>("past_trips");
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [caption, setCaption] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const toast = useToast();

  // New state for drag-and-drop + preview + progress
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    fetchPhotos();
  }, [category]);

  // Cleanup preview blob URL on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/gallery?category=${category}`);
      const data = await res.json();
      setPhotos(data);
    } catch {
      // ignore
    }
  };

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_MIME.includes(file.type)) {
      return "Unsupported format. Use JPEG, PNG, WebP, or GIF.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`;
    }
    return null;
  };

  // Process file from either input or drop
  const processFile = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      setUploadError(error);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    startUpload(file, url);
  };

  // Main upload flow with progress tracking
  const startUpload = async (file: File, previewUrl: string) => {
    setUploading(true);
    setUploadError("");
    setUploadProgress(10);

    try {
      // Step 1: Get a signed upload URL
      setUploadStatus("Getting upload URL...");
      setUploadProgress(15);
      const urlRes = await fetch("/api/gallery/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, category }),
      });
      if (!urlRes.ok) {
        const d = await urlRes.json().catch(() => ({}));
        throw new Error(d.error || `Failed to get upload URL`);
      }
      const { signedUrl, token, filePath } = await urlRes.json();
      setUploadProgress(33);

      // Step 2: Upload file directly to Supabase Storage
      setUploadStatus("Uploading...");
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) {
        const text = await uploadRes.text().catch(() => "");
        throw new Error(`Upload failed: ${text.slice(0, 200)}`);
      }
      setUploadProgress(75);

      // Step 3: Create gallery record in database
      setUploadStatus("Saving...");
      const recordRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath,
          category,
          caption: caption.trim() || null,
        }),
      });
      if (!recordRes.ok) {
        const d = await recordRes.json().catch(() => ({}));
        throw new Error(d.error || `Failed to save photo record`);
      }

      setUploadProgress(100);
      setUploadStatus("");
      setCaption("");
      fetchPhotos();
      toast.success("Photo uploaded!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 600);

      // Clear preview after brief success display
      setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
        setPreview(null);
        setUploadProgress(0);
      }, 1000);
    } catch (err) {
      setUploadStatus("");
      setUploadProgress(0);
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
      toast.error(msg);
      URL.revokeObjectURL(previewUrl);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  // Drag-and-drop handlers (using counter for nested element support)
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/gallery/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      setSelectedPhoto(null);
      fetchPhotos();
    } catch {
      // ignore
    }
  };

  return (
    <section id="gallery" className="scroll-mt-20 py-16">
      <PageHeader title="GALLERY" subtitle="Memories from past trips and this one" color="pink" />

      {/* Category tabs */}
      <div className="mb-4 flex justify-center">
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
      </div>

      {/* Upload zone — drag-and-drop + click to browse */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`mb-6 cursor-pointer rounded-xl border-2 border-dashed transition-all ${
          dragActive
            ? "border-neon-pink bg-neon-pink/5"
            : showSuccess
              ? "border-neon-cyan bg-neon-cyan/5"
              : "border-[var(--border)] hover:border-neon-pink/30"
        } ${showSuccess ? "success-flash" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          disabled={uploading}
        />

        {preview ? (
          /* Preview + progress bar */
          <div className="flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Upload preview"
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full bg-neon-pink transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-1.5 truncate text-xs text-gray-400">
                {uploadProgress >= 100 ? "Done!" : uploadStatus || "Preparing..."}
              </p>
            </div>
          </div>
        ) : (
          /* Default drop zone */
          <div className="px-4 py-8 text-center">
            {/* Upload icon */}
            <svg className="mx-auto mb-2 h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-gray-300">
              {dragActive ? "Drop image to upload" : "Drag & drop an image, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              JPEG, PNG, WebP, GIF — Max 10 MB
            </p>

            {/* Caption input (inside zone but stop propagation so clicks don't trigger file dialog) */}
            <input
              type="text"
              placeholder="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="mt-3 mx-auto block w-full max-w-xs rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-pink"
            />
          </div>
        )}
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
      <Modal open={!!selectedPhoto} onClose={() => { setSelectedPhoto(null); setConfirmDelete(null); }}>
        {selectedPhoto && (
          <div className="flex flex-col items-center">
            <div className="relative max-h-[75vh] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.file_url}
                alt={selectedPhoto.caption ?? "Gallery photo"}
                className="mx-auto max-h-[75vh] max-w-full rounded-lg object-contain"
              />
            </div>
            <div className="mt-3 flex w-full items-center justify-between">
              <div>
                {selectedPhoto.caption && (
                  <p className="text-sm text-gray-300">{selectedPhoto.caption}</p>
                )}
                <p className="text-xs text-gray-600">
                  by {selectedPhoto.profile?.display_name ?? "Unknown"}
                </p>
              </div>
              {confirmDelete === selectedPhoto.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Delete?</span>
                  <button
                    onClick={() => handleDelete(selectedPhoto.id)}
                    className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/30"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-gray-400 transition-colors hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(selectedPhoto.id)}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
