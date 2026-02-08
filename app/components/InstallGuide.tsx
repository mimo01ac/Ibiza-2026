"use client";

import { useState, useEffect } from "react";

export default function InstallGuide() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem("pwa-dismissed") === "1") return;

    // Don't show if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Detect platform
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem("pwa-dismissed", "1");
    setVisible(false);
  };

  return (
    <div className="md:hidden mx-auto mt-12 mb-4 max-w-sm">
      <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon-pink/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neon-pink">
              <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <line x1="9" y1="19" x2="15" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Add to Home Screen</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              {isIOS
                ? "Tap the Share button, then \"Add to Home Screen\" for the full app experience."
                : "Tap the menu (⋮), then \"Install App\" for the full app experience."}
            </p>
          </div>
        </div>

        <button
          onClick={dismiss}
          className="mt-4 w-full rounded-lg bg-white/10 py-2 text-xs font-medium text-gray-300 hover:bg-white/15 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
