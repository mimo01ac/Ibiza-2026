"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function guestLogin(email: string, password: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Wrong password — please try again" };
    }
    // NEXT_REDIRECT throws an error that must be re-thrown
    throw error;
  }
}
