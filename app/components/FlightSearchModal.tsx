"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "./Modal";
import type { Flight, FlightLeg, TripPackage, FlightSearchResponse } from "@/lib/types/database";

function FlightLegCard({ leg, direction }: { leg: FlightLeg; direction: "outbound" | "inbound" }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {direction === "outbound" ? "CPH → IBZ" : "IBZ → CPH"}
        </span>
        {leg.stops === 0 ? (
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
            Direct
          </span>
        ) : (
          <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
            {leg.stops} stop{leg.stops > 1 ? "s" : ""}
            {leg.stop_cities?.length ? ` (${leg.stop_cities.join(", ")})` : ""}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-foreground">{leg.departure_time}</p>
          <p className="text-xs text-gray-500">{leg.departure_airport}</p>
        </div>
        <div className="flex flex-1 flex-col items-center px-3">
          <p className="text-xs text-gray-500">{leg.duration}</p>
          <div className="my-1 h-px w-full bg-[var(--border)]" />
          <p className="text-xs text-neon-cyan">{leg.airline}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-foreground">{leg.arrival_time}</p>
          <p className="text-xs text-gray-500">{leg.arrival_airport}</p>
        </div>
      </div>
      {leg.flight_number && (
        <p className="mt-1 text-xs text-gray-600">{leg.flight_number}</p>
      )}
    </div>
  );
}

function TripPackageCard({
  pkg,
  index,
  total,
  arrivalDate,
  departureDate,
}: {
  pkg: TripPackage;
  index: number;
  total: number;
  arrivalDate: string;
  departureDate: string;
}) {
  // Build Skyscanner deep link: /transport/flights/cph/ibz/YYMMDD/YYMMDD/
  const fmtSky = (d: string) => d.replace(/-/g, "").slice(2); // "2026-06-25" → "260625"
  const skyscannerUrl = `https://www.skyscanner.net/transport/flights/cph/ibz/${fmtSky(arrivalDate)}/${fmtSky(departureDate)}/`;
  const googleFlightsUrl = `https://www.google.com/travel/flights?q=flights+from+CPH+to+IBZ+on+${arrivalDate}+return+${departureDate}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">
          Option {index + 1} of {total}
        </h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-neon-cyan">
            {pkg.price_eur > 0 ? `€${pkg.price_eur}` : "Price TBD"}
          </p>
          <p className="text-xs text-gray-500">per person, round-trip</p>
        </div>
      </div>

      <FlightLegCard leg={pkg.outbound} direction="outbound" />
      <FlightLegCard leg={pkg.inbound} direction="inbound" />

      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href={skyscannerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-surface px-3 py-2 text-sm text-gray-300 transition-colors hover:border-neon-cyan hover:text-neon-cyan"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Skyscanner
        </a>
        <a
          href={googleFlightsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-surface px-3 py-2 text-sm text-gray-300 transition-colors hover:border-neon-cyan hover:text-neon-cyan"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Google Flights
        </a>
      </div>
    </div>
  );
}

interface FlightSearchModalProps {
  open: boolean;
  onClose: () => void;
  userFlight: Flight;
  onBooked: () => void;
}

export default function FlightSearchModal({
  open,
  onClose,
  userFlight,
  onBooked,
}: FlightSearchModalProps) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FlightSearchResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const search = useCallback(async () => {
    setSearching(true);
    setError(null);
    setResults(null);
    setCurrentIndex(0);

    try {
      const res = await fetch("/api/flights/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arrival_date: userFlight.arrival_date,
          departure_date: userFlight.departure_date,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Flight search failed");
      }

      const data: FlightSearchResponse = await res.json();
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, [userFlight.arrival_date, userFlight.departure_date]);

  useEffect(() => {
    if (open) {
      search();
    }
  }, [open, search]);

  const handleMarkBooked = async () => {
    setBookingLoading(true);
    try {
      const res = await fetch(`/api/flights/${userFlight.id}/booked`, {
        method: "PATCH",
      });
      if (res.ok) {
        onBooked();
      }
    } catch {
      // ignore
    } finally {
      setBookingLoading(false);
    }
  };

  const packages = results?.packages ?? [];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < packages.length - 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      onPrev={hasPrev ? () => setCurrentIndex((i) => i - 1) : undefined}
      onNext={hasNext ? () => setCurrentIndex((i) => i + 1) : undefined}
    >
      <div className="w-[90vw] max-w-lg rounded-xl border border-[var(--border)] bg-surface p-5">
        <h2 className="mb-1 text-lg font-bold text-neon-cyan">Find Round-Trip Flights</h2>
        <p className="mb-4 text-xs text-gray-500">
          CPH → IBZ on {userFlight.arrival_date} &nbsp;|&nbsp; IBZ → CPH on {userFlight.departure_date}
        </p>

        {searching && (
          <div className="flex flex-col items-center gap-3 py-12">
            <svg className="h-8 w-8 animate-spin text-neon-cyan" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-400">Searching for flights...</p>
            <p className="text-xs text-gray-600">This may take 15-30 seconds</p>
          </div>
        )}

        {error && (
          <div className="py-8 text-center">
            <p className="mb-3 text-sm text-red-400">{error}</p>
            <button
              onClick={search}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              Try Again
            </button>
          </div>
        )}

        {results && packages.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400">No flights found for these dates.</p>
            {results.data_freshness && (
              <p className="mt-2 text-xs text-yellow-400">{results.data_freshness}</p>
            )}
          </div>
        )}

        {results && packages.length > 0 && (
          <>
            <TripPackageCard
              pkg={packages[currentIndex]}
              index={currentIndex}
              total={packages.length}
              arrivalDate={userFlight.arrival_date}
              departureDate={userFlight.departure_date}
            />

            {results.data_freshness && (
              <p className="mt-3 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                {results.data_freshness}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <p className="text-xs text-gray-600">{results.search_summary}</p>
              <button
                onClick={handleMarkBooked}
                disabled={bookingLoading || userFlight.booked}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {userFlight.booked
                  ? "Booked!"
                  : bookingLoading
                    ? "Saving..."
                    : "Mark as Booked"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
