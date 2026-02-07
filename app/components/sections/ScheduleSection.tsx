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

      {/* Desktop week grid (lg+) */}
      {days.length > 0 && (
        <div className="hidden lg:grid lg:grid-cols-7 lg:gap-3">
          {days.map((day) => {
            const colEvents = events
              .filter((e) => e.date === day)
              .sort((a, b) => b.vote_count - a.vote_count);
            return (
              <div key={day} className="min-w-0">
                <div className="mb-2 rounded-lg bg-neon-pink/10 px-2 py-1.5 text-center text-xs font-bold text-neon-pink">
                  {formatDate(day)}
                </div>
                <div className="space-y-2">
                  {colEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-[var(--border)] bg-surface p-2.5"
                    >
                      <h4 className="text-xs font-semibold leading-tight text-foreground">
                        {event.title}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-neon-cyan">{event.club}</p>
                      {event.time && (
                        <p className="text-[11px] text-gray-500">{event.time}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-1">
                        <VoteButton
                          entityId={event.id}
                          initialCount={event.vote_count}
                          initialVoted={event.user_voted}
                          apiEndpoint="/api/events"
                        />
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="rounded p-1 text-gray-600 hover:text-red-400"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {colEvents.length === 0 && (
                    <p className="py-4 text-center text-[11px] text-gray-600">No events</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile day tabs + events (< lg) */}
      <div className="lg:hidden">
        {days.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
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

        <div className="space-y-3">
          {dayEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-[var(--border)] bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground">{event.title}</h3>
                  <p className="text-sm text-neon-cyan">{event.club}</p>
                  {event.time && (
                    <p className="text-sm text-gray-500">{event.time}</p>
                  )}
                  {event.description && (
                    <p className="mt-1 text-sm text-gray-400">{event.description}</p>
                  )}
                  {event.ticket_url && (
                    <a
                      href={event.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-neon-purple hover:underline"
                    >
                      Get Tickets
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <VoteButton
                    entityId={event.id}
                    initialCount={event.vote_count}
                    initialVoted={event.user_voted}
                    apiEndpoint="/api/events"
                  />
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="rounded-lg p-1.5 text-gray-600 hover:text-red-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <CommentSection entityId={event.id} apiEndpoint="/api/events" />
            </div>
          ))}
          {dayEvents.length === 0 && activeDay && (
            <p className="text-center text-sm text-gray-600">No events for this day yet.</p>
          )}
          {events.length === 0 && (
            <p className="text-center text-sm text-gray-600">No events added yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
