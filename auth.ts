import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";

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
        const name = (credentials.name as string | undefined)?.trim();
        const password = credentials.password as string | undefined;

        if (!name || !password) return null;
        if (password !== process.env.GUEST_PASSWORD) return null;

        const normalized = normalizeGuestName(name);
        return {
          id: `guest_${normalized}`,
          name: name,
          email: `guest_${normalized}@ibiza-2026.app`,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, profile }) {
      if (profile) {
        token.picture =
          (profile as Record<string, unknown>).picture?.toString() ??
          `https://graph.facebook.com/${profile.id}/picture?type=large`;
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
