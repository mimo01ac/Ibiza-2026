import type { ClubConfig, ScrapedEvent } from "./types";

const MAX_HTML_LENGTH = 40_000;

/**
 * Strip styles, scripts (except data-bearing ones), and HTML comments.
 * Keep JSON-LD, __NUXT__, dataLayer, and similar data blocks.
 */
export function preprocessHtml(html: string): string {
  let cleaned = html;

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // Remove <style> tags and contents
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Remove <script> tags EXCEPT those containing useful data
  cleaned = cleaned.replace(
    /<script[\s\S]*?<\/script>/gi,
    (match) => {
      // Keep scripts with JSON-LD, __NUXT__, dataLayer, or inline JSON data
      if (
        /application\/ld\+json/i.test(match) ||
        /__NUXT__/i.test(match) ||
        /dataLayer/i.test(match) ||
        /"@type"\s*:/i.test(match) ||
        /"events"\s*:/i.test(match)
      ) {
        return match;
      }
      return "";
    }
  );

  // Remove SVG content
  cleaned = cleaned.replace(/<svg[\s\S]*?<\/svg>/gi, "");

  // Collapse whitespace
  cleaned = cleaned.replace(/\s{2,}/g, " ");

  // Truncate if still too long
  if (cleaned.length > MAX_HTML_LENGTH) {
    cleaned = cleaned.slice(0, MAX_HTML_LENGTH);
  }

  return cleaned;
}

/**
 * Call Claude Haiku to extract structured event data from HTML.
 */
export async function parseEventsWithAI(
  html: string,
  club: ClubConfig
): Promise<ScrapedEvent[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const processedHtml = preprocessHtml(html);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: `You are an event data extractor. Given HTML from the club "${club.name}", extract all upcoming 2026 events into a JSON array.

Each event object must have these fields:
- "title": string (event/party name, include headliner DJ names)
- "club": "${club.name}" (always use this exact string)
- "date": string in YYYY-MM-DD format (only 2026 dates)
- "time": string or null (e.g. "23:00", "22:00 - 06:00")
- "description": string or null (short description, lineup details)
- "ticket_url": string or null (full URL to buy tickets)

Rules:
- Only include events in 2026
- Skip past events
- If a date is ambiguous, prefer DD/MM/YYYY (European format)
- Return ONLY the JSON array, no markdown, no explanation
- If no events found, return []

Hints for this site: ${club.aiHints}`,
      messages: [
        {
          role: "user",
          content: `Extract 2026 events from this HTML:\n\n${processedHtml}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "[]";

  return extractAndValidateEvents(text, club.name);
}

/**
 * Extract JSON array from AI response and validate each event.
 */
function extractAndValidateEvents(
  text: string,
  clubName: string
): ScrapedEvent[] {
  // Try to find a JSON array in the response
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return [];

  let parsed: unknown[];
  try {
    parsed = JSON.parse(arrayMatch[0]);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is Record<string, unknown> => {
      if (typeof item !== "object" || item === null) return false;
      const e = item as Record<string, unknown>;

      // Must have title and date
      if (typeof e.title !== "string" || !e.title.trim()) return false;
      if (typeof e.date !== "string") return false;

      // Date must be valid YYYY-MM-DD in 2026
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return false;
      if (!e.date.startsWith("2026-")) return false;

      // Validate date is actually valid
      const d = new Date(e.date + "T00:00:00Z");
      if (isNaN(d.getTime())) return false;

      return true;
    })
    .map((e) => ({
      title: (e.title as string).trim(),
      club: clubName,
      date: e.date as string,
      time: typeof e.time === "string" ? e.time.trim() || null : null,
      description:
        typeof e.description === "string"
          ? e.description.trim() || null
          : null,
      ticket_url:
        typeof e.ticket_url === "string"
          ? e.ticket_url.trim() || null
          : null,
    }));
}
