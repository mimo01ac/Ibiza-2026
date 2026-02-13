"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "../PageHeader";
import VoteButton from "../VoteButton";
import VoterAvatars from "../VoterAvatars";
import type { GroceryItemWithVotes, GroceryCategory } from "@/lib/types/database";

const CATEGORY_ORDER: GroceryCategory[] = ["food_snacks", "drinks", "other"];

const CATEGORY_META: Record<
  GroceryCategory,
  { label: string; icon: string }
> = {
  food_snacks: { label: "Food & Snacks", icon: "\u{1F355}" },
  drinks: { label: "Drinks", icon: "\u{1F378}" },
  other: { label: "Other", icon: "\u{1F6D2}" },
};

const ITEMS_PER_CATEGORY = 6;

/* ── Add Item Form ──────────────────────────────── */
function AddItemForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, quantity }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add item");
      }

      setName("");
      setQuantity(1);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-surface p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-gray-400">
          Item name
        </label>
        <input
          type="text"
          placeholder="e.g. San Miguel, Beef Jerky, Sunscreen..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-[var(--border)] bg-background px-4 py-2.5 text-sm text-foreground placeholder-gray-600 outline-none transition-colors focus:border-neon-purple"
        />
      </div>

      <div className="flex items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Qty
          </label>
          <div className="flex items-center rounded-lg border border-[var(--border)] bg-background">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-2.5 py-2 text-sm text-gray-400 hover:text-neon-purple"
            >
              -
            </button>
            <span className="min-w-[2rem] text-center text-sm font-semibold text-foreground">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="px-2.5 py-2 text-sm text-gray-400 hover:text-neon-purple"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg bg-neon-purple/90 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-neon-purple disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Adding...
            </span>
          ) : (
            "+ Add"
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400 sm:col-span-full">{error}</p>
      )}
    </form>
  );
}

/* ── Grocery Item Row ───────────────────────────── */
function GroceryItemRow({
  item,
  onUpdate,
  onDelete,
  voteCounts,
  setVoteCounts,
}: {
  item: GroceryItemWithVotes;
  onUpdate: () => void;
  onDelete: (id: string) => void;
  voteCounts: Record<string, number>;
  setVoteCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const [toggling, setToggling] = useState(false);

  const handleTogglePurchased = async () => {
    setToggling(true);
    try {
      const res = await fetch(`/api/grocery/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_purchased: !item.is_purchased }),
      });
      if (res.ok) onUpdate();
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  };

  const handleCategoryChange = async (cat: GroceryCategory) => {
    if (cat === item.category) return;
    try {
      const res = await fetch(`/api/grocery/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat }),
      });
      if (res.ok) onUpdate();
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-surface px-3 py-2.5 transition-all hover:border-neon-purple/30 ${
        item.is_purchased ? "opacity-50" : ""
      }`}
    >
      {/* Purchased checkbox */}
      <button
        onClick={handleTogglePurchased}
        disabled={toggling}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          item.is_purchased
            ? "border-neon-purple bg-neon-purple/20 text-neon-purple"
            : "border-gray-600 hover:border-neon-purple/50"
        }`}
      >
        {item.is_purchased && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Name + quantity */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={`truncate text-sm font-medium ${
            item.is_purchased
              ? "text-gray-500 line-through"
              : "text-foreground"
          }`}
        >
          {item.name}
        </span>
        {item.quantity > 1 && (
          <span className="shrink-0 rounded-full bg-neon-purple/10 px-1.5 py-0.5 text-[10px] font-bold text-neon-purple">
            x{item.quantity}
          </span>
        )}
      </div>

      {/* Vote + Voters */}
      <VoteButton
        entityId={item.id}
        initialCount={item.vote_count}
        initialVoted={item.user_voted}
        apiEndpoint="/api/grocery"
        onVoteChange={(count) =>
          setVoteCounts((prev) => ({ ...prev, [item.id]: count }))
        }
      />
      <VoterAvatars
        entityId={item.id}
        entityType="grocery"
        voteCount={voteCounts[item.id] ?? item.vote_count}
      />

      {/* Category change icons (shown on hover) */}
      <div className="hidden shrink-0 items-center gap-0.5 sm:group-hover:flex">
        {CATEGORY_ORDER.filter((c) => c !== item.category).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            title={`Move to ${CATEGORY_META[cat].label}`}
            className="rounded p-1 text-xs transition-colors hover:bg-neon-purple/10 hover:text-neon-purple"
          >
            {CATEGORY_META[cat].icon}
          </button>
        ))}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="shrink-0 rounded p-1 text-gray-600 transition-colors hover:text-red-400"
        title="Delete item"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}

/* ── Category Group ─────────────────────────────── */
function CategoryGroup({
  category,
  items,
  onUpdate,
  onDelete,
  voteCounts,
  setVoteCounts,
}: {
  category: GroceryCategory;
  items: GroceryItemWithVotes[];
  onUpdate: () => void;
  onDelete: (id: string) => void;
  voteCounts: Record<string, number>;
  setVoteCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[category];
  const visible = expanded ? items : items.slice(0, ITEMS_PER_CATEGORY);
  const hiddenCount = items.length - ITEMS_PER_CATEGORY;

  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Category header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">{meta.icon}</span>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
          {meta.label}
        </h3>
        <span className="rounded-full bg-neon-purple/10 px-2 py-0.5 text-[10px] font-bold text-neon-purple">
          {items.length}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {visible.map((item) => (
          <GroceryItemRow
            key={item.id}
            item={item}
            onUpdate={onUpdate}
            onDelete={onDelete}
            voteCounts={voteCounts}
            setVoteCounts={setVoteCounts}
          />
        ))}
      </div>

      {/* Expand/collapse */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-medium text-neon-purple transition-colors hover:text-neon-purple/80"
        >
          {expanded
            ? "Show less"
            : `Show ${hiddenCount} more item${hiddenCount !== 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}

/* ── Main Section ───────────────────────────────── */
export default function GrocerySection() {
  const [items, setItems] = useState<GroceryItemWithVotes[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/grocery");
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/grocery/${id}`, { method: "DELETE" });
      fetchItems();
    } catch {
      // ignore
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const { downloadGroceryPdf } = await import(
        "@/lib/grocery/generate-pdf"
      );
      downloadGroceryPdf(items);
    } catch {
      // ignore
    } finally {
      setPdfLoading(false);
    }
  };

  // Group by category, with purchased items at the bottom within each group
  const grouped: Record<GroceryCategory, GroceryItemWithVotes[]> = {
    food_snacks: [],
    drinks: [],
    other: [],
  };

  for (const item of items) {
    grouped[item.category].push(item);
  }

  // Sort within each group: unpurchased first
  for (const cat of CATEGORY_ORDER) {
    grouped[cat].sort((a, b) => {
      if (a.is_purchased !== b.is_purchased) return a.is_purchased ? 1 : -1;
      return 0;
    });
  }

  // Category summary counts
  const totalItems = items.length;
  const purchasedCount = items.filter((i) => i.is_purchased).length;

  return (
    <section id="grocery" className="scroll-mt-20 py-16">
      <PageHeader
        title="SHOPPING LIST"
        subtitle="Add groceries & drinks for the villa — upvote what you want most"
        color="purple"
      />

      <AddItemForm onAdded={fetchItems} />

      {/* Category groups */}
      {CATEGORY_ORDER.map((cat) => (
        <CategoryGroup
          key={cat}
          category={cat}
          items={grouped[cat]}
          onUpdate={fetchItems}
          onDelete={handleDelete}
          voteCounts={voteCounts}
          setVoteCounts={setVoteCounts}
        />
      ))}

      {items.length === 0 && (
        <p className="text-center text-sm text-gray-600">
          No items yet. Add something to the shopping list!
        </p>
      )}

      {/* Summary bar + PDF download */}
      {totalItems > 0 && (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-[var(--border)] bg-surface p-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {CATEGORY_ORDER.map((cat) => {
              const count = grouped[cat].length;
              if (count === 0) return null;
              return (
                <span key={cat} className="flex items-center gap-1">
                  <span>{CATEGORY_META[cat].icon}</span>
                  <span>
                    {CATEGORY_META[cat].label}: {count}
                  </span>
                </span>
              );
            })}
            <span className="text-gray-600">|</span>
            <span>
              Total: {totalItems} &middot; Purchased: {purchasedCount} &middot;
              Remaining: {totalItems - purchasedCount}
            </span>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="shrink-0 rounded-lg border border-neon-purple/30 px-4 py-2 text-xs font-semibold text-neon-purple transition-colors hover:bg-neon-purple/10 disabled:opacity-50"
          >
            {pdfLoading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      )}
    </section>
  );
}
