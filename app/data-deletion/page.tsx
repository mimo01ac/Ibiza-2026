import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion - Ibiza 2026",
};

export default function DataDeletion() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Data Deletion</h1>

      <div className="space-y-6 text-sm leading-relaxed text-gray-400">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            How to Request Deletion of Your Data
          </h2>
          <p>
            Ibiza 2026 uses Facebook Login for authentication. If you wish to delete your
            account and all associated data from our app, follow the steps below.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Option 1: Contact Us</h2>
          <p>
            Send a request to the app administrator to delete your account. We will remove
            all data associated with your profile, including:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Your profile (name, email, avatar)</li>
            <li>Your event votes and comments</li>
            <li>Your wildcard submissions, votes, and comments</li>
            <li>Your flight details</li>
            <li>Your room allocation</li>
            <li>Your uploaded photos</li>
          </ul>
          <p className="mt-2">
            Your data will be deleted within 30 days of your request.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Option 2: Remove via Facebook
          </h2>
          <p>
            You can also remove the app&apos;s access to your Facebook data directly:
          </p>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>Go to your Facebook Settings &amp; Privacy &rarr; Settings</li>
            <li>Click &quot;Apps and Websites&quot;</li>
            <li>Find &quot;Ibiza 2026&quot; and click &quot;Remove&quot;</li>
            <li>Check &quot;Delete all posts, photos and videos on Facebook that Ibiza 2026 may have published on your behalf&quot;</li>
            <li>Click &quot;Remove&quot;</li>
          </ol>
          <p className="mt-2">
            After removing the app from Facebook, contact the app administrator to also
            delete your data from our database.
          </p>
        </section>
      </div>
    </div>
  );
}
