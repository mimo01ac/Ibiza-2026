import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Ibiza 2026",
};

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: February 7, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-gray-400">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">1. Introduction</h2>
          <p>
            Ibiza 2026 (&quot;we&quot;, &quot;our&quot;, &quot;the app&quot;) is a private trip planning portal
            for a group of friends. This policy explains how we handle your information when you
            use our website at ibiza-2026.vercel.app.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">2. Information We Collect</h2>
          <p>When you sign in with Facebook, we receive:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Your name</li>
            <li>Your email address</li>
            <li>Your profile picture</li>
          </ul>
          <p className="mt-2">
            We also store data you voluntarily provide, such as flight details, event votes,
            comments, and uploaded photos.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
          <p>Your information is used solely to:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Identify you within the app and display your name and avatar</li>
            <li>Enable trip planning features (voting, comments, flight tracking, room allocation)</li>
            <li>Show your contributions to other members of the trip group</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">4. Data Storage</h2>
          <p>
            Your data is stored securely in Supabase (hosted on AWS). We do not sell, trade,
            or share your personal data with third parties. Access is limited to members of the
            trip group.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">5. Data Retention &amp; Deletion</h2>
          <p>
            Your data is retained for the duration of the trip planning period. You may request
            deletion of your account and all associated data at any time by contacting the app
            administrator.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">6. Cookies</h2>
          <p>
            We use essential cookies only for authentication (session management). We do not
            use tracking cookies or analytics.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">7. Third-Party Services</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li><strong>Facebook Login</strong> (Meta Platforms) — for authentication</li>
            <li><strong>Supabase</strong> — for data storage</li>
            <li><strong>Vercel</strong> — for hosting</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">8. Contact</h2>
          <p>
            For any questions about this privacy policy or to request data deletion,
            contact the app administrator.
          </p>
        </section>
      </div>
    </div>
  );
}
