"use client";

import { useEffect, useCallback } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, onPrev, onNext, children }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      {/* Prev arrow */}
      {onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-gray-400 transition-colors hover:text-neon-cyan sm:left-4"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next arrow */}
      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-gray-400 transition-colors hover:text-neon-cyan sm:right-4"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div
        className="relative max-h-[90vh] max-w-4xl overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 rounded-full bg-surface p-2 text-gray-400 transition-colors hover:text-neon-pink"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
