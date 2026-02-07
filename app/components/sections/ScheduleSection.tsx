"use client";

import { useState, useEffect } from "react";
import PageHeader from "../PageHeader";
import VoteButton from "../VoteButton";
import CommentSection from "../CommentSection";
import type { EventWithVotes } from "@/lib/types/database";

interface ScheduleSectionProps {
  isAdmin: boolean;
}

export default function ScheduleSection({ isAdmin }: ScheduleSectionProps) {
  const [events, setEvents] = useState<EventWithVotes[]>([]);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: "",
    club: "",
    date: "",
    time: "",
    description: "",
    ticket_url: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data);
      if (data.length > 0 && !activeDay) {
        setActiveDay(data[0].date);
      }
    } catch {
      // ignore
    }
  };

  const days = [...new Set(events.map((e) => e.date))].sort();
  const dayEvents = events
    .filter((e) => e.date === activeDay)
    .sort((a, b) => b.vote_count - a.vote_count);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ title: "", club: "", date: "", time: "", description: "", ticket_url: "" });
        setShowForm(false);
        fetchEvents();
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/events/${id}`, { method: "DELETE" });
      fetchEvents();
    } catch {
      // ignore
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <section id="schedule" className="scroll-mt-20 py-16">
      <PageHeader title="CLUB SCHEDULE" subtitle="Vote for the nights you want" color="pink" />

      {isAdmin && (
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg border border-neon-pink bg-neon-pink/10 px-4 py-2 text-sm font-semibold text-neon-pink transition-colors hover:bg-neon-pink/20"
          >
            {showForm ? "Cancel" : "+ Add Event"}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 rounded-xl border border-[var(--border)] bg-surface p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Event title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-pink"
            />
            <input
              type="text"
              placeholder="Club name *"
              value={formData.club}
              onChange={(e) => setFormData({ ...formData, club: e.target.value })}
              required
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-pink"
            />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-neon-pink"
            />
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-neon-pink"
            />
            <input
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-pink"
            />
            <input
              type="url"
              placeholder="Ticket URL"
              value={formData.ticket_url}
              onChange={(e) => setFormData({ ...formData, ticket_url: e.target.value })}
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-pink"
            />
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-neon-pink px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Create Event
          </button>
        </form>
      )}

      {/* ═══ DESKTOP: All days visible at once, no tabs ═══ */}
      <div className="hidden md:block space-y-10">
        {days.map((day) => {
          const DESKTOP_DEFAULT = 8;
          const evts = events
            .filter((e) => e.date === day)
            .sort((a, b) => b.vote_count - a.vote_count);
          const isExpanded = expandedDays.has(day);
          const hiddenCount = evts.length - DESKTOP_DEFAULT;

          return (
            <div key={day}>
              {/* Date header */}
              <h3 className="mb-3 rounded-lg bg-neon-pink/10 px-4 py-2 text-sm font-semibold text-neon-pink">
                {formatDate(day)}
              </h3>

              {/* 4-col event grid */}
              <div className="grid grid-cols-4 gap-3">
                {evts.map((event, idx) => (
                  <div
                    key={event.id}
                    className={`rounded-xl border p-3 ${
                      idx === 0 && event.vote_count > 0
                        ? "border-neon-pink/40 bg-neon-pink/5"
                        : "border-[var(--border)] bg-surface"
                    } ${idx >= DESKTOP_DEFAULT && !isExpanded ? "hidden" : ""}`}
                  >
                    {idx === 0 && event.vote_count > 0 && (
                      <span className="mb-1 inline-block text-xs text-neon-pink">★ Top pick</span>
                    )}
                    <h4 className="text-sm font-semibold leading-tight text-foreground">
                      {event.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-neon-cyan">{event.club}</p>
                    {event.time && (
                      <p className="text-xs text-gray-500">{event.time}</p>
                    )}
                    {event.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-400">{event.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <VoteButton
                        entityId={event.id}
                        initialCount={event.vote_count}
                        initialVoted={event.user_voted}
                        apiEndpoint="/api/events"
                      />
                      {event.ticket_url && (
                        <a
                          href={event.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-neon-purple/30 px-2 py-1 text-xs text-neon-purple transition-colors hover:bg-neon-purple/10"
                        >
                          Tickets
                        </a>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="ml-auto rounded p-1 text-gray-600 hover:text-red-400"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Expand button if >8 events */}
              {hiddenCount > 0 && (
                <button
                  onClick={() => {
                    const next = new Set(expandedDays);
                    if (isExpanded) next.delete(day);
                    else next.add(day);
                    setExpandedDays(next);
                  }}
                  className="mt-3 w-full rounded-lg border border-[var(--border)] py-2 text-center text-sm text-gray-400 transition-colors hover:text-neon-pink"
                >
                  {isExpanded ? "Show less" : `Show ${hiddenCount} more events`}
                </button>
              )}

              {evts.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-600">No events for this day yet.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ MOBILE: Day tabs + 1-col list, expand after 2 ═══ */}
      <div className="md:hidden">
        {days.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeDay === day
                    ? "bg-neon-pink/20 text-neon-pink neon-glow-pink"
                    : "border border-[var(--border)] text-gray-400 hover:text-neon-pink"
                }`}
              >
                {formatDate(day)}
              </button>
            ))}
          </div>
        )}

        {(() => {
          const MOBILE_DEFAULT = 2;
          const isExpanded = activeDay ? expandedDays.has(activeDay) : false;
          const hiddenCount = dayEvents.length - MOBILE_DEFAULT;

          return (
            <>
              <div className="space-y-2">
                {dayEvents.map((event, idx) => (
                  <div
                    key={event.id}
                    className={`rounded-xl border p-3 ${
                      idx === 0 && event.vote_count > 0
                        ? "border-neon-pink/40 bg-neon-pink/5"
                        : "border-[var(--border)] bg-surface"
                    } ${idx >= MOBILE_DEFAULT && !isExpanded ? "hidden" : ""}`}
                  >
                    {idx === 0 && event.vote_count > 0 && (
                      <span className="mb-1 inline-block text-xs text-neon-pink">★ Top pick</span>
                    )}
                    <h4 className="text-sm font-semibold leading-tight text-foreground">
                      {event.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-neon-cyan">{event.club}</p>
                    {event.time && (
                      <p className="text-xs text-gray-500">{event.time}</p>
                    )}
                    {event.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-400">{event.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <VoteButton
                        entityId={event.id}
                        initialCount={event.vote_count}
                        initialVoted={event.user_voted}
                        apiEndpoint="/api/events"
                      />
                      {event.ticket_url && (
                        <a
                          href={event.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-neon-purple/30 px-2 py-1 text-xs text-neon-purple transition-colors hover:bg-neon-purple/10"
                        >
                          Tickets
                        </a>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="ml-auto rounded p-1 text-gray-600 hover:text-red-400"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {hiddenCount > 0 && activeDay && (
                <button
                  onClick={() => {
                    const next = new Set(expandedDays);
                    if (isExpanded) next.delete(activeDay);
                    else next.add(activeDay);
                    setExpandedDays(next);
                  }}
                  className="mt-3 w-full rounded-lg border border-[var(--border)] py-2 text-center text-sm text-gray-400 transition-colors hover:text-neon-pink"
                >
                  {isExpanded ? "Show less" : `Show ${hiddenCount} more events`}
                </button>
              )}

              {dayEvents.length === 0 && activeDay && (
                <p className="text-center text-sm text-gray-600">No events for this day yet.</p>
              )}
            </>
          );
        })()}
      </div>

      {events.length === 0 && (
        <p className="text-center text-sm text-gray-600">No events added yet.</p>
      )}
    </section>
  );
}
