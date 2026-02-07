import { createAdminClient } from "@/lib/supabase/admin";
import { CLUBS } from "./clubs";
import { parseEventsWithAI } from "./ai-parser";
import type { ClubConfig, ScrapeResult, ScrapeRunSummary } from "./types";

const FETCH_TIMEOUT = 15_000;
const BOT_EMAIL = "bot@ibiza-scraper.internal";
const BATCH_SIZE = 3;

/**
 * Get or create the bot profile used as created_by for scraped events.
 */
async function getOrCreateBotProfile(): Promise<string> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_email", BOT_EMAIL)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      auth_user_email: BOT_EMAIL,
      display_name: "Event Bot",
      avatar_url: null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create bot profile: ${error.message}`);
  return created.id;
}

/**
 * Fetch HTML from a URL with timeout and basic error handling.
 */
async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Ibiza2026Bot/1.0; +https://ibiza-2026.vercel.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Scrape a single club — try each URL until one succeeds.
 */
async function scrapeClub(club: ClubConfig): Promise<ScrapeResult> {
  for (const url of club.urls) {
    try {
      const html = await fetchHtml(url);
      const events = await parseEventsWithAI(html, club);
      return { club: club.name, events };
    } catch (err) {
      // If this isn't the last URL, try the next one
      if (url !== club.urls[club.urls.length - 1]) continue;
      return {
        club: club.name,
        events: [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return { club: club.name, events: [], error: "No URLs configured" };
}

/**
 * Process clubs in batches of BATCH_SIZE for parallel execution.
 */
async function scrapeAllClubs(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (let i = 0; i < CLUBS.length; i += BATCH_SIZE) {
    const batch = CLUBS.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(scrapeClub));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Insert new events into the database, skipping duplicates.
 * Deduplication: same title (case-insensitive, trimmed) + date + club.
 */
async function insertNewEvents(
  results: ScrapeResult[],
  botProfileId: string
): Promise<number> {
  const supabase = createAdminClient();
  let totalInserted = 0;

  // Collect all scraped events
  const allEvents = results.flatMap((r) => r.events);
  if (allEvents.length === 0) return 0;

  // Fetch existing events to deduplicate in-memory
  const { data: existing } = await supabase
    .from("events")
    .select("title, date, club");

  const existingKeys = new Set(
    (existing ?? []).map(
      (e) =>
        `${e.title.toLowerCase().trim()}|${e.date}|${e.club.toLowerCase().trim()}`
    )
  );

  // Filter to only new events
  const newEvents = allEvents.filter((e) => {
    const key = `${e.title.toLowerCase().trim()}|${e.date}|${e.club.toLowerCase().trim()}`;
    return !existingKeys.has(key);
  });

  if (newEvents.length === 0) return 0;

  // Insert in batches of 50
  for (let i = 0; i < newEvents.length; i += 50) {
    const batch = newEvents.slice(i, i + 50).map((e) => ({
      title: e.title,
      club: e.club,
      date: e.date,
      time: e.time,
      description: e.description,
      ticket_url: e.ticket_url,
      created_by: botProfileId,
    }));

    const { data, error } = await supabase
      .from("events")
      .insert(batch)
      .select("id");

    if (error) {
      console.error("Insert batch error:", error.message);
      continue;
    }

    totalInserted += data?.length ?? 0;
  }

  return totalInserted;
}

/**
 * Main orchestration function — run the full scrape pipeline.
 */
export async function runScrapeJob(): Promise<ScrapeRunSummary> {
  const startedAt = new Date().toISOString();

  // Step 1: Ensure bot profile exists
  const botProfileId = await getOrCreateBotProfile();

  // Step 2: Scrape all clubs
  const results = await scrapeAllClubs();

  // Step 3: Insert new events (deduplicated)
  const totalNewEvents = await insertNewEvents(results, botProfileId);

  return {
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    results,
    total_new_events: totalNewEvents,
  };
}
