import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Facebook],
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.picture =
          (profile as Record<string, unknown>).picture?.toString() ??
          `https://graph.facebook.com/${profile.id}/picture?type=large`;
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
