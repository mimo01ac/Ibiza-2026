import type { NextAuthConfig } from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";

export default {
  trustHost: true,
  providers: [
    Facebook,
    Credentials({
      credentials: {
        name: { label: "Name" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;
