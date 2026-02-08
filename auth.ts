import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeGuestName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
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
    jwt({ token, user, profile }) {
      if (profile) {
        // Facebook returns picture as { data: { url: "..." } }, not a string.
        // Auth.js normalizes it to user.image via the provider's profile() fn.
        const fbPic = (profile as Record<string, any>).picture;
        token.picture =
          user?.image ??
          (typeof fbPic === "string" ? fbPic : fbPic?.data?.url) ??
          `https://graph.facebook.com/${profile.id}/picture?type=large`;

        // Store Facebook user ID on the profile for GDPR data deletion lookups.
        // Fire-and-forget — we don't await so it doesn't slow down login.
        if (profile.id && user?.email) {
          const supabase = createAdminClient();
          supabase
            .from("profiles")
            .update({ facebook_id: String(profile.id) })
            .eq("auth_user_email", user.email)
            .then(({ error }) => {
              if (error) {
                console.warn("[auth] Failed to store facebook_id:", error.message);
              }
            });
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
