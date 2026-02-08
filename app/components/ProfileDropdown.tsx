"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import UserAvatar from "./UserAvatar";

interface ProfileData {
  display_name: string;
  avatar_url: string | null;
  contact_email: string | null;
}

interface ProfileDropdownProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const { update } = useSession();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Fetch profile when dropdown opens
  useEffect(() => {
    if (!open) return;
    setMessage("");
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfile(data);
        setDisplayName(data.display_name);
        setContactEmail(data.contact_email ?? "");
        setAvatarPreview(data.avatar_url);
        setAvatarFile(null);
      })
      .catch(() => setMessage("Failed to load profile"));
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be under 5MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    // Step 1: Get signed upload URL
    const urlRes = await fetch("/api/profile/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name }),
    });
    const { signedUrl, token, filePath } = await urlRes.json();
    if (!signedUrl) throw new Error("Failed to get upload URL");

    // Step 2: Upload file directly to Supabase Storage
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadRes.ok) throw new Error("Upload failed");

    // Step 3: Construct public URL
    // Token is not needed for public bucket — use the public URL pattern
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    void token; // signed upload token, not needed for public URL
    return `${supabaseUrl}/storage/v1/object/public/avatars/${filePath}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      let newAvatarUrl = profile?.avatar_url ?? null;

      // Upload avatar if changed
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile);
      }

      // PATCH profile
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          avatar_url: newAvatarUrl,
          contact_email: contactEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      // Refresh session so navbar + other components update
      await update();
      setMessage("Saved!");
      setAvatarFile(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger: clickable avatar + name */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-surface"
      >
        <UserAvatar
          src={user.image}
          name={user.name ?? "User"}
          size="md"
          className="ring-2 ring-neon-cyan"
        />
        <span className="hidden text-sm text-gray-300 sm:inline">
          {user.name}
        </span>
        <svg
          className={`h-3 w-3 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg shadow-black/50">
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            {/* Avatar preview + upload */}
            <div className="flex items-center gap-3">
              <UserAvatar
                src={avatarPreview}
                name={displayName || user.name || "User"}
                size="lg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-neon-cyan hover:text-neon-cyan"
              >
                Change Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Display name */}
            <div>
              <label className="mb-1 block text-xs text-gray-500">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
              />
            </div>

            {/* Contact email */}
            <div>
              <label className="mb-1 block text-xs text-gray-500">Email (optional)</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
              />
            </div>

            {/* Status message */}
            {message && (
              <p className={`text-xs ${message === "Saved!" ? "text-green-400" : "text-red-400"}`}>
                {message}
              </p>
            )}

            {/* Save button */}
            <button
              type="submit"
              disabled={saving || !displayName.trim()}
              className="rounded-lg border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>

            {/* Divider */}
            <div className="h-px bg-[var(--border)]" />

            {/* Sign out */}
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-gray-400 transition-colors hover:border-neon-pink hover:text-neon-pink"
            >
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
