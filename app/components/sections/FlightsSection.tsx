"use client";

import { useState, useEffect } from "react";
import PageHeader from "../PageHeader";
import { useToast } from "../Toast";
import type { Flight } from "@/lib/types/database";

const TRIP_START = "2026-06-25";
const TRIP_END = "2026-07-05";

const COLORS = [
  "bg-neon-pink",
  "bg-neon-cyan",
  "bg-neon-purple",
  "bg-neon-yellow",
  "bg-green-500",
  "bg-orange-500",
  "bg-blue-500",
  "bg-red-500",
];

export default function FlightsSection() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [view, setView] = useState<"table" | "timeline">("table");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    arrival_date: "",
    arrival_time: "",
    departure_date: "",
    departure_time: "",
    flight_number_in: "",
    flight_number_out: "",
    notes: "",
  });
  const toast = useToast();

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const res = await fetch("/api/flights");
      const data = await res.json();
      setFlights(data);
    } catch {
      toast.error("Failed to load flights.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        fetchFlights();
        toast.success("Flight saved!");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save flight.");
      }
    } catch {
      toast.error("Failed to save flight.");
    } finally {
      setSaving(false);
    }
  };

  // Timeline helpers
  const startDate = new Date(TRIP_START);
  const endDate = new Date(TRIP_END);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const dates = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getBarPosition = (arrival: string, departure: string) => {
    const arrDate = new Date(arrival);
    const depDate = new Date(departure);
    const left = Math.max(0, (arrDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const width = Math.max(1, (depDate.getTime() - arrDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
      left: `${(left / totalDays) * 100}%`,
      width: `${(width / totalDays) * 100}%`,
    };
  };

  return (
    <section id="flights" className="scroll-mt-20 py-16">
      <PageHeader title="FLIGHT TRACKER" subtitle="When is everyone arriving?" color="cyan" />

      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg border border-neon-cyan bg-neon-cyan/10 px-4 py-2 text-sm font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/20"
        >
          {showForm ? "Cancel" : "Add / Edit My Flight"}
        </button>
        <div className="flex rounded-lg border border-[var(--border)]">
          <button
            onClick={() => setView("table")}
            className={`px-3 py-1.5 text-sm ${view === "table" ? "bg-surface text-neon-cyan" : "text-gray-500"}`}
          >
            Table
          </button>
          <button
            onClick={() => setView("timeline")}
            className={`px-3 py-1.5 text-sm ${view === "timeline" ? "bg-surface text-neon-cyan" : "text-gray-500"}`}
          >
            Timeline
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-[var(--border)] bg-surface p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Arrival Date *</label>
              <input
                type="date"
                value={formData.arrival_date}
                onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-neon-cyan"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Arrival Time</label>
              <input
                type="time"
                value={formData.arrival_time}
                onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-neon-cyan"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Departure Date *</label>
              <input
                type="date"
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-neon-cyan"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Departure Time</label>
              <input
                type="time"
                value={formData.departure_time}
                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-neon-cyan"
              />
            </div>
            <input
              type="text"
              placeholder="Inbound flight number"
              value={formData.flight_number_in}
              onChange={(e) => setFormData({ ...formData, flight_number_in: e.target.value })}
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
            />
            <input
              type="text"
              placeholder="Outbound flight number"
              value={formData.flight_number_out}
              onChange={(e) => setFormData({ ...formData, flight_number_out: e.target.value })}
              className="rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
            />
          </div>
          <input
            type="text"
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-4 w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground placeholder-gray-600 outline-none focus:border-neon-cyan"
          />
          <button
            type="submit"
            disabled={saving}
            className="mt-4 flex items-center gap-2 rounded-lg bg-neon-cyan px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saving ? "Saving..." : "Save Flight"}
          </button>
        </form>
      )}

      {view === "table" ? (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {flights.map((f) => (
              <div key={f.id} className="rounded-xl border border-[var(--border)] bg-surface p-4">
                <p className="mb-2 font-semibold text-neon-cyan">
                  {f.profile?.display_name ?? "Unknown"}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Arrival</p>
                    <p className="text-gray-300">
                      {f.arrival_date}
                      {f.arrival_time && <span className="ml-1 text-gray-500">{f.arrival_time}</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Departure</p>
                    <p className="text-gray-300">
                      {f.departure_date}
                      {f.departure_time && <span className="ml-1 text-gray-500">{f.departure_time}</span>}
                    </p>
                  </div>
                </div>
                {(f.flight_number_in || f.flight_number_out) && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {f.flight_number_in && (
                      <div>
                        <p className="text-xs text-gray-500">Flight In</p>
                        <p className="text-gray-400">{f.flight_number_in}</p>
                      </div>
                    )}
                    {f.flight_number_out && (
                      <div>
                        <p className="text-xs text-gray-500">Flight Out</p>
                        <p className="text-gray-400">{f.flight_number_out}</p>
                      </div>
                    )}
                  </div>
                )}
                {f.notes && (
                  <>
                    <div className="my-2 border-t border-[var(--border)]" />
                    <p className="text-xs text-gray-500">{f.notes}</p>
                  </>
                )}
              </div>
            ))}
            {flights.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-600">No flights added yet.</p>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-[var(--border)] md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-surface">
                <tr>
                  <th className="px-4 py-3 text-gray-500">Who</th>
                  <th className="px-4 py-3 text-gray-500">Arrival</th>
                  <th className="px-4 py-3 text-gray-500">Departure</th>
                  <th className="px-4 py-3 text-gray-500">Flight In</th>
                  <th className="px-4 py-3 text-gray-500">Flight Out</th>
                  <th className="px-4 py-3 text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {flights.map((f) => (
                  <tr key={f.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-neon-cyan">
                      {f.profile?.display_name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {f.arrival_date} {f.arrival_time && <span className="text-gray-500">{f.arrival_time}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {f.departure_date} {f.departure_time && <span className="text-gray-500">{f.departure_time}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{f.flight_number_in ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400">{f.flight_number_out ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{f.notes ?? "—"}</td>
                  </tr>
                ))}
                {flights.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-600">
                      No flights added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Timeline view */
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-surface p-4">
          {/* Date headers */}
          <div className="relative mb-2 flex" style={{ minWidth: `${totalDays * 60}px` }}>
            {dates.map((d, i) => (
              <div
                key={i}
                className="flex-1 text-center text-xs text-gray-500"
              >
                {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            ))}
          </div>

          {/* Grid lines */}
          <div className="relative" style={{ minWidth: `${totalDays * 60}px` }}>
            <div className="absolute inset-0 flex">
              {dates.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-l border-[var(--border)] first:border-l-0"
                />
              ))}
            </div>

            {/* Flight bars */}
            <div className="relative space-y-2 py-2">
              {flights.map((f, i) => {
                const pos = getBarPosition(f.arrival_date, f.departure_date);
                return (
                  <div key={f.id} className="relative h-8">
                    <div
                      className={`absolute top-0 h-full rounded-full ${COLORS[i % COLORS.length]} flex items-center px-3 text-xs font-semibold text-black opacity-80`}
                      style={{ left: pos.left, width: pos.width, minWidth: "60px" }}
                    >
                      <span className="truncate">{f.profile?.display_name ?? "Unknown"}</span>
                    </div>
                  </div>
                );
              })}
              {flights.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-600">No flights to display.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
