import type { NextAuthConfig } from "next-auth";
import Facebook from "next-auth/providers/facebook";

export default {
  providers: [Facebook],
} satisfies NextAuthConfig;
