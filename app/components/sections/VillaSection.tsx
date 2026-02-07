"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import PageHeader from "../PageHeader";
import CopyButton from "../CopyButton";
import Modal from "../Modal";

const TAXI_INFO = [
  { destination: "Ibiza Airport (IBZ)", time: "~15 min", distance: "12 km" },
  { destination: "Ibiza Old Town (Dalt Vila)", time: "~10 min", distance: "6 km" },
  { destination: "Pacha / Marina Botafoch", time: "~8 min", distance: "5 km" },
  { destination: "Playa d'en Bossa", time: "~15 min", distance: "10 km" },
  { destination: "San Antonio", time: "~30 min", distance: "22 km" },
  { destination: "Santa Eulalia", time: "~10 min", distance: "7 km" },
];

export default function VillaSection() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/villa-photos")
      .then((r) => r.json())
      .then((data) => setPhotos(data))
      .catch(() => {});
  }, []);

  return (
    <section id="villa" className="scroll-mt-20 py-16">
      <PageHeader title="CASA OLIVO" subtitle="Your home base in Ibiza" color="yellow" />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Info cards */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neon-yellow text-glow-yellow">
              Address
            </h3>
            <CopyButton text="Carrer del Olivo, 50, 07849 Can Furnet, Illes Balears, Spain" label="Address" />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neon-yellow text-glow-yellow">
              Wi-Fi
            </h3>
            <CopyButton text="CasaOlivo2026" label="Password" />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neon-yellow text-glow-yellow">
              Taxi
            </h3>
            <CopyButton text="+34 971 398 483" label="Radio Taxi" />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-gray-500">
                    <th className="pb-2 pr-4">Destination</th>
                    <th className="pb-2 pr-4">Est. Time</th>
                    <th className="pb-2">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {TAXI_INFO.map((row) => (
                    <tr key={row.destination} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2 pr-4 text-gray-300">{row.destination}</td>
                      <td className="py-2 pr-4 text-neon-cyan">{row.time}</td>
                      <td className="py-2 text-gray-400">{row.distance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3084.5!2d1.458667!3d38.95!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zQ2FycmVyIGRlbCBPbGl2bywgNTAsIDA3ODQ5IENhbiBGdXJuZXQ!5e0!3m2!1sen!2ses!4v1"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Villa Location"
            />
          </div>
        </div>
      </div>

      {/* Villa photos */}
      {photos.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Villa Photos
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => setSelectedPhoto(url)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--border)]"
              >
                <Image
                  src={url}
                  alt={`Villa photo ${i + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <Modal open={!!selectedPhoto} onClose={() => setSelectedPhoto(null)}>
        {selectedPhoto && (
          <Image
            src={selectedPhoto}
            alt="Villa photo"
            width={1200}
            height={800}
            className="rounded-lg"
          />
        )}
      </Modal>
    </section>
  );
}
