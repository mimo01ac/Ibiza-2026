"use client";

import { useState } from "react";
import SignInButton from "./SignInButton";
import ProfileDropdown from "./ProfileDropdown";

const NAV_LINKS = [
  { label: "Events", href: "#wildcards" },
  { label: "Schedule", href: "#schedule", adminOnly: true },
  { label: "Food", href: "#restaurants" },
  { label: "Shopping", href: "#grocery" },
  { label: "Flights", href: "#flights" },
  { label: "DJ", href: "#dj" },
  { label: "Rooms", href: "#rooms", adminOnly: true },
  { label: "Gallery", href: "#gallery" },
  { label: "Villa", href: "#villa" },
];

interface NavbarClientProps {
  user: {
    name?: string | null;
    image?: string | null;
  } | null;
  isAdmin: boolean;
}

export default function NavbarClient({ user, isAdmin }: NavbarClientProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-lg font-bold tracking-wider text-neon-pink text-glow-pink"
        >
          IBIZA 2026
        </button>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.filter((l) => !l.adminOnly || isAdmin).map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-neon-cyan"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right side: user + hamburger */}
        <div className="flex items-center gap-3">
          {user ? (
            <ProfileDropdown user={user} />
          ) : (
            <SignInButton />
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="ml-2 rounded-lg p-1.5 text-gray-400 hover:text-neon-cyan md:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-md md:hidden">
          <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {NAV_LINKS.filter((l) => !l.adminOnly || isAdmin).map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-400 transition-colors hover:bg-surface hover:text-neon-cyan"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
