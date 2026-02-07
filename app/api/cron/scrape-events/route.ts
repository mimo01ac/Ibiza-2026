import { NextRequest, NextResponse } from "next/server";
import { runScrapeJob } from "@/lib/scraper/scrape-events";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify cron secret — Vercel sends it as Authorization: Bearer <secret>
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runScrapeJob();

    console.log(
      `[scrape-events] Done: ${summary.total_new_events} new events inserted`,
      summary.results.map((r) => ({
        club: r.club,
        events: r.events.length,
        error: r.error,
      }))
    );

    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[scrape-events] Fatal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
