import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeGuestName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

// Store facebook_id on the profile — completely detached from the auth flow.
function storeFacebookId(facebookId: string, email: string) {
  try {
    const supabase = createAdminClient();
    Promise.resolve(
      supabase
        .from("profiles")
        .update({ facebook_id: facebookId })
        .eq("auth_user_email", email)
    ).then(({ error }) => {
      if (error) console.warn("[auth] Failed to store facebook_id:", error.message);
    }).catch(() => {
      // Silently ignore — this is a non-critical background task
    });
  } catch {
    // Silently ignore — createAdminClient() may fail on edge runtime
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  debug: true,
  pages: { error: "/auth/error" },
  session: { strategy: "jwt" },
  providers: [
    Facebook,
    Credentials({
      credentials: {
        name: { label: "Name", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) return null;

          const name = String(credentials.name ?? "").trim();
          const password = String(credentials.password ?? "");

          if (!name || !password) return null;

          // Env var check + hardcoded fallback for debugging
          const expected = process.env.GUEST_PASSWORD ?? "casaolivo";
          if (password !== expected) return null;

          const normalized = normalizeGuestName(name);
          return {
            id: `guest_${normalized}`,
            name,
            email: `guest_${normalized}@ibiza-2026.app`,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    redirect({ url, baseUrl }) {
      // Ensure redirects always go to our app
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // Invalid URL — fall back to base
      }
      return baseUrl;
    },
    jwt({ token, user, profile }) {
      if (profile) {
        const fbPic = (profile as Record<string, any>).picture;
        token.picture =
          user?.image ??
          (typeof fbPic === "string" ? fbPic : fbPic?.data?.url) ??
          (profile.id
            ? `https://graph.facebook.com/${profile.id}/picture?type=large`
            : undefined);

        // Fire-and-forget — completely detached from the auth flow
        if (profile.id && user?.email) {
          storeFacebookId(String(profile.id), user.email);
        }
      }
      if (user) {
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.picture) {
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
});
