import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import CountdownTimer from "./components/CountdownTimer";
import ConfirmedParticipants from "./components/ConfirmedParticipants";
import AllSections from "./components/sections/AllSections";
import InstallGuide from "./components/InstallGuide";
import LandingPage from "./components/LandingPage";

export default async function Home() {
  const session = await auth();

  // Not logged in — show landing page
  if (!session?.user) {
    return <LandingPage />;
  }

  let isAdmin = false;
  try {
    if (session.user.email) {
      const supabase = createAdminClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("auth_user_email", session.user.email)
        .single();
      if (profile) isAdmin = profile.is_admin;
    }
  } catch {
    // profiles table may not exist yet
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-16">
      {/* Hero section */}
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-neon-pink/5 blur-[128px]" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-neon-cyan/5 blur-[128px]" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-purple/5 blur-[100px]" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <h1 className="text-glow-pink text-6xl font-extrabold tracking-tight text-neon-pink sm:text-8xl">
            IBIZA
          </h1>
          <p className="text-glow-cyan text-3xl font-light tracking-[0.3em] text-neon-cyan sm:text-5xl">
            2026
          </p>

          <div className="mt-4 h-px w-48 bg-gradient-to-r from-transparent via-neon-purple to-transparent" />

          <p className="max-w-md text-lg text-gray-400">
            The countdown has begun. Get ready for the trip of a lifetime.
          </p>

          <div className="mt-6">
            <CountdownTimer />
          </div>

          <p className="mt-8 text-sm uppercase tracking-[0.25em] text-gray-600">
            June 27, 2026
          </p>
        </div>
      </div>

      {/* Confirmed participants */}
      <ConfirmedParticipants isAdmin={isAdmin} />

      {/* All feature sections */}
      <AllSections isAdmin={isAdmin} />

      {/* PWA install guide (mobile only) */}
      <InstallGuide />

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-gray-600">
        <a href="/privacy" className="hover:text-gray-400 transition-colors">
          Privacy Policy
        </a>
      </footer>
    </div>
  );
}
