import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import CountdownTimer from "./components/CountdownTimer";
import AllSections from "./components/sections/AllSections";

export default async function Home() {
  let isAdmin = false;

  try {
    const session = await auth();
    if (session?.user?.email) {
      const supabase = await createClient();
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
    <div className="mx-auto max-w-6xl px-4">
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

      {/* All feature sections */}
      <AllSections isAdmin={isAdmin} />
    </div>
  );
}
