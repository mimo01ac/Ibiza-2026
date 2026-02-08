"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

function AuthErrorContent() {
  const params = useSearchParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const error = params.get("error") ?? "Unknown";

  // If the user is actually logged in (session exists), auto-redirect home.
  // This handles the case where login succeeded but Auth.js still showed error page.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const messages: Record<string, string> = {
    Configuration: "Server configuration problem — check AUTH_SECRET, AUTH_FACEBOOK_ID, AUTH_FACEBOOK_SECRET env vars.",
    AccessDenied: "Access denied — you may not be a registered test user for this Facebook app.",
    Verification: "Token verification failed — try clearing cookies and logging in again.",
    OAuthSignin: "Could not start the OAuth flow — Facebook provider may be misconfigured.",
    OAuthCallback: "Error in the OAuth callback — the redirect URI may not match Facebook's settings.",
    OAuthCreateAccount: "Could not create user account from OAuth provider.",
    Callback: "Error in the auth callback handler.",
    Default: "An unknown authentication error occurred.",
  };

  // If authenticated, show brief redirect message
  if (status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-400">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-surface p-6 text-center">
        <h1 className="mb-2 text-lg font-bold text-red-400">Authentication Error</h1>
        <p className="mb-4 text-sm text-gray-400">
          {messages[error] ?? messages.Default}
        </p>
        <p className="mb-6 rounded bg-black/30 px-3 py-2 font-mono text-xs text-gray-500">
          Error code: {error}
        </p>
        <a
          href="/"
          className="inline-block rounded-lg border border-neon-cyan/50 bg-neon-cyan/10 px-6 py-2 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}
