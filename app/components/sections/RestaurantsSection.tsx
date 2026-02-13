"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "../PageHeader";
import VoteButton from "../VoteButton";
import VoterAvatars from "../VoterAvatars";
import CommentSection from "../CommentSection";
import Modal from "../Modal";
import type { RestaurantWithVotes } from "@/lib/types/database";

/* ── Cuisine type icons (emoji shorthand) ── */
const CUISINE_ICONS: Record<string, string> = {
  mediterranean: "\u{1F33F}",
  "asian fusion": "\u{1F962}",
  japanese: "\u{1F363}",
  "japanese-peruvian": "\u{1F363}",
  nikkei: "\u{1F363}",
  seafood: "\u{1F990}",
  italian: "\u{1F35D}",
  french: "\u{1F957}",
  "french-mediterranean": "\u{1F957}",
  mexican: "\u{1F32E}",
  indian: "\u{1F35B}",
  thai: "\u{1F35C}",
  spanish: "\u{1F958}",
  steakhouse: "\u{1F969}",
  sushi: "\u{1F363}",
  vegan: "\u{1F331}",
  default: "\u{1F374}",
};

function getCuisineIcon(cuisine: string | null): string {
  if (!cuisine) return CUISINE_ICONS.default;
  const key = cuisine.toLowerCase();
  return CUISINE_ICONS[key] ?? CUISINE_ICONS.default;
}

/* ── TripAdvisor star display ── */
function TripAdvisorBadge({ rating, url }: { rating: number | null; url: string | null }) {
  if (!rating) return null;

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(
        <span key={i} className="text-emerald-400">&#9733;</span>
      );
    } else if (i - 0.5 <= rating) {
      stars.push(
        <span key={i} className="text-emerald-400/60">&#9733;</span>
      );
    } else {
      stars.push(
        <span key={i} className="text-gray-600">&#9733;</span>
      );
    }
  }

  const badge = (
    <div className="flex items-center gap-1.5">
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#34E0A1" fillOpacity="0.15" />
        <circle cx="12" cy="12" r="5" fill="#34E0A1" />
      </svg>
      <div className="flex items-center text-xs">
        {stars}
        <span className="ml-1 text-gray-400">{rating}</span>
      </div>
    </div>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-opacity hover:opacity-80"
        title="View on TripAdvisor"
      >
        {badge}
      </a>
    );
  }

  return badge;
}

/* ── Helper: check if URL is an actual image ── */
function isImageUrl(url: string | null): boolean {
  if (!url) return false;
  return /\.(jpe?g|png|webp|gif|avif|svg)/i.test(url);
}

/* ── Restaurant Card ── */
function RestaurantCard({
  restaurant,
  onDelete,
  onSelect,
  voteCounts,
  setVoteCounts,
}: {
  restaurant: RestaurantWithVotes;
  onDelete: (id: string, name: string) => void;
  onSelect: (r: RestaurantWithVotes) => void;
  voteCounts: Record<string, number>;
  setVoteCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const hasImage = isImageUrl(restaurant.image_url);

  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-surface transition-all hover:border-neon-yellow/30"
      onClick={() => onSelect(restaurant)}
    >
      {/* Background image */}
      <div className="relative h-44 w-full overflow-hidden">
        {hasImage ? (
          <img
            src={restaurant.image_url!}
            alt={restaurant.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface to-background">
            <span className="text-4xl opacity-30">{getCuisineIcon(restaurant.cuisine_type)}</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />

        {/* Cuisine badge */}
        {restaurant.cuisine_type && (
          <div className="absolute right-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-gray-300 backdrop-blur-sm">
            {getCuisineIcon(restaurant.cuisine_type)} {restaurant.cuisine_type}
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(restaurant.id, restaurant.name); }}
          className="absolute left-3 top-3 rounded-full bg-background/80 p-1.5 text-gray-500 backdrop-blur-sm transition-colors hover:text-red-400 opacity-0 group-hover:opacity-100"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Header */}
        <h3 className="text-lg font-bold leading-tight text-foreground">
          {restaurant.name}
        </h3>

        {/* TripAdvisor rating */}
        <TripAdvisorBadge rating={restaurant.tripadvisor_rating} url={null} />

        {/* Description */}
        {restaurant.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-gray-400">
            {restaurant.description}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions row */}
        <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3" onClick={(e) => e.stopPropagation()}>
          <VoteButton
            entityId={restaurant.id}
            initialCount={restaurant.vote_count}
            initialVoted={restaurant.user_voted}
            apiEndpoint="/api/restaurants"
            onVoteChange={(count) =>
              setVoteCounts((prev) => ({ ...prev, [restaurant.id]: count }))
            }
          />
          <VoterAvatars
            entityId={restaurant.id}
            entityType="restaurants"
            voteCount={voteCounts[restaurant.id] ?? restaurant.vote_count}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Restaurant Detail Modal ── */
function RestaurantDetail({
  restaurant,
  onClose,
  onDelete,
  voteCounts,
  setVoteCounts,
}: {
  restaurant: RestaurantWithVotes;
  onClose: () => void;
  onDelete: (id: string, name: string) => void;
  voteCounts: Record<string, number>;
  setVoteCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const hasImage = isImageUrl(restaurant.image_url);

  return (
    <Modal open onClose={onClose}>
      <div className="w-[90vw] max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-surface">
        {/* Image header */}
        {hasImage ? (
          <div className="relative h-52 w-full">
            <img
              src={restaurant.image_url!}
              alt={restaurant.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          </div>
        ) : (
          <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-surface to-background">
            <span className="text-5xl opacity-30">{getCuisineIcon(restaurant.cuisine_type)}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5">
          {/* Title + cuisine */}
          <h3 className="text-xl font-bold text-foreground">{restaurant.name}</h3>
          {restaurant.cuisine_type && (
            <p className="mt-1 text-xs text-neon-yellow">
              {getCuisineIcon(restaurant.cuisine_type)} {restaurant.cuisine_type}
            </p>
          )}

          {/* TripAdvisor rating */}
          {restaurant.tripadvisor_rating && (
            <div className="mt-2">
              <TripAdvisorBadge rating={restaurant.tripadvisor_rating} url={null} />
            </div>
          )}

          {/* Full description */}
          {restaurant.description && (
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              {restaurant.description}
            </p>
          )}

          {/* Links */}
          <div className="mt-4 flex flex-wrap gap-2">
            {restaurant.website_url && (
              <a
                href={restaurant.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neon-yellow/30 px-3 py-2 text-xs font-semibold text-neon-yellow transition-colors hover:bg-neon-yellow/10"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit Website
              </a>
            )}
            {restaurant.tripadvisor_url && (
              <a
                href={restaurant.tripadvisor_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/10"
              >
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#34E0A1" fillOpacity="0.15" />
                  <circle cx="12" cy="12" r="5" fill="#34E0A1" />
                </svg>
                TripAdvisor Reviews
              </a>
            )}
          </div>

          {/* Map */}
          <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border)]">
            <iframe
              title={`Map of ${restaurant.name}`}
              width="100%"
              height="200"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(restaurant.name + ", Ibiza, Spain")}&output=embed`}
            />
            <a
              href={`https://www.google.com/maps/dir/${encodeURIComponent("Carrer del Olivo 50, Can Furnet, Ibiza")}/${encodeURIComponent(restaurant.name + ", Ibiza, Spain")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-background/50 px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:text-neon-cyan"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Get Directions from Villa
            </a>
          </div>

          {/* Vote + voters + delete */}
          <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
            <VoteButton
              entityId={restaurant.id}
              initialCount={restaurant.vote_count}
              initialVoted={restaurant.user_voted}
              apiEndpoint="/api/restaurants"
              onVoteChange={(count) =>
                setVoteCounts((prev) => ({ ...prev, [restaurant.id]: count }))
              }
            />
            <VoterAvatars
              entityId={restaurant.id}
              entityType="restaurants"
              voteCount={voteCounts[restaurant.id] ?? restaurant.vote_count}
            />
            <button
              onClick={() => { onClose(); onDelete(restaurant.id, restaurant.name); }}
              className="ml-auto rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
            >
              Delete
            </button>
          </div>

          {/* Comments */}
          <div className="mt-3">
            <CommentSection
              entityId={restaurant.id}
              apiEndpoint="/api/restaurants"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ── Add Restaurant Form (available to all users) ── */
function AddRestaurantForm({
  onAdded,
}: {
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [researching, setResearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    name: string;
    cuisine_type: string;
    description: string;
    tripadvisor_rating: number | null;
    tripadvisor_url: string | null;
    image_url: string | null;
  } | null>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setResearching(true);
    setError("");
    setPreview(null);

    try {
      const res = await fetch("/api/restaurants/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Research failed");
      }

      const data = await res.json();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed");
    } finally {
      setResearching(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);

    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...preview,
          website_url: url.trim() || null,
        }),
      });

      if (res.ok) {
        setName("");
        setUrl("");
        setPreview(null);
        onAdded();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8 rounded-xl border border-[var(--border)] bg-surface p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Suggest a Restaurant
      </h3>
      <form onSubmit={handleResearch} className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Restaurant name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 rounded-lg border border-[var(--border)] bg-background px-4 py-2.5 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-yellow transition-colors"
          />
          <button
            type="submit"
            disabled={researching || !name.trim()}
            className="shrink-0 rounded-lg bg-neon-yellow/90 px-5 py-2.5 text-sm font-semibold text-background transition-all hover:bg-neon-yellow disabled:opacity-50"
          >
            {researching ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Researching...
              </span>
            ) : (
              "Research with AI"
            )}
          </button>
        </div>
        <input
          type="url"
          placeholder="Website URL (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-background px-4 py-2.5 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-yellow transition-colors"
        />
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      {/* Preview card */}
      {preview && (
        <div className="mt-4 rounded-xl border border-neon-yellow/20 bg-neon-yellow/5 p-4">
          <div className="flex gap-4">
            {preview.image_url && (
              <img
                src={preview.image_url}
                alt={preview.name}
                className="h-24 w-24 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-foreground">{preview.name}</h4>
              {preview.cuisine_type && (
                <p className="text-xs text-neon-yellow">
                  {getCuisineIcon(preview.cuisine_type)} {preview.cuisine_type}
                </p>
              )}
              {preview.tripadvisor_rating && (
                <div className="mt-1">
                  <TripAdvisorBadge rating={preview.tripadvisor_rating} url={null} />
                </div>
              )}
              {preview.description && (
                <p className="mt-1 text-sm text-gray-400">{preview.description}</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-neon-yellow/90 px-4 py-2 text-sm font-semibold text-background transition-all hover:bg-neon-yellow disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Restaurant"}
            </button>
            <button
              onClick={() => setPreview(null)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-gray-400 transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mobile Carousel ── */
function MobileCarousel({
  restaurants,
  onDelete,
  onSelect,
  voteCounts,
  setVoteCounts,
}: {
  restaurants: RestaurantWithVotes[];
  onDelete: (id: string, name: string) => void;
  onSelect: (r: RestaurantWithVotes) => void;
  voteCounts: Record<string, number>;
  setVoteCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / (el.clientWidth * 0.82));
    setActiveIndex(Math.min(idx, restaurants.length - 1));
  }, [restaurants.length]);

  const scrollTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth * 0.82;
    el.scrollTo({ left: idx * cardWidth, behavior: "smooth" });
  };

  if (restaurants.length === 0) return null;

  return (
    <div className="md:hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="w-[82vw] shrink-0 snap-center"
          >
            <RestaurantCard
              restaurant={r}
              onDelete={onDelete}
              onSelect={onSelect}
              voteCounts={voteCounts}
              setVoteCounts={setVoteCounts}
            />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {restaurants.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {restaurants.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === i ? "w-4 bg-neon-yellow" : "w-1.5 bg-gray-600"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Section ── */
interface RestaurantsSectionProps {
  isAdmin: boolean;
}

export default function RestaurantsSection({ isAdmin: _isAdmin }: RestaurantsSectionProps) {
  const [restaurants, setRestaurants] = useState<RestaurantWithVotes[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithVotes | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch("/api/restaurants");
      const data = await res.json();
      setRestaurants(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/restaurants/${deleteTarget.id}`, { method: "DELETE" });
      fetchRestaurants();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Sort by vote count descending
  const sorted = [...restaurants].sort((a, b) => b.vote_count - a.vote_count);

  return (
    <section id="restaurants" className="scroll-mt-20 py-16">
      <PageHeader
        title="RESTAURANTS"
        subtitle="Upvote your favorite spots — help us pick the best dinner reservations"
        color="yellow"
      />

      {/* Add restaurant — available to all users */}
      <div className="mb-6 text-center">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg border border-neon-yellow bg-neon-yellow/10 px-4 py-2 text-sm font-semibold text-neon-yellow transition-colors hover:bg-neon-yellow/20"
        >
          {showForm ? "Cancel" : "+ Suggest a Restaurant"}
        </button>
      </div>

      {showForm && <AddRestaurantForm onAdded={() => { fetchRestaurants(); setShowForm(false); }} />}

      {/* Desktop Grid */}
      {sorted.length > 0 && (
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sorted.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              onDelete={handleDeleteRequest}
              onSelect={setSelectedRestaurant}
              voteCounts={voteCounts}
              setVoteCounts={setVoteCounts}
            />
          ))}
        </div>
      )}

      {/* Mobile Carousel */}
      <MobileCarousel
        restaurants={sorted}
        onDelete={handleDeleteRequest}
        onSelect={setSelectedRestaurant}
        voteCounts={voteCounts}
        setVoteCounts={setVoteCounts}
      />

      {restaurants.length === 0 && !showForm && (
        <p className="text-center text-sm text-gray-600">
          No restaurants added yet. Be the first to suggest one!
        </p>
      )}

      {/* Restaurant detail modal */}
      {selectedRestaurant && (
        <RestaurantDetail
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          onDelete={handleDeleteRequest}
          voteCounts={voteCounts}
          setVoteCounts={setVoteCounts}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <div className="w-80 rounded-xl border border-[var(--border)] bg-surface p-6">
          <h3 className="text-base font-bold text-foreground">Delete restaurant?</h3>
          <p className="mt-2 text-sm text-gray-400">
            Are you sure you want to remove <span className="font-semibold text-foreground">{deleteTarget?.name}</span> from the list? This cannot be undone.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-gray-400 transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
