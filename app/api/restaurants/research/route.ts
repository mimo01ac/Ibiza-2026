import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth-helpers";

interface ResearchResult {
  name: string;
  cuisine_type: string;
  description: string;
  tripadvisor_rating: number | null;
  tripadvisor_url: string | null;
  image_url: string | null;
}

export async function POST(req: NextRequest) {
  try {
    await getSessionOrThrow();

    const { name, url } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI research is not configured. Add ANTHROPIC_API_KEY to environment." },
        { status: 500 }
      );
    }

    const query = url
      ? `Research this restaurant: "${name}" — website: ${url}`
      : `Research this restaurant in Ibiza, Spain: "${name}"`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 5,
          },
        ],
        system: `You are a restaurant research assistant. When given a restaurant name (and optionally a URL), use web search to find information about it. The restaurant is likely in Ibiza, Spain unless the context suggests otherwise. Always respond with ONLY a valid JSON object (no markdown, no code blocks, no explanation).`,
        messages: [
          {
            role: "user",
            content: `${query}

Find the following and return as a JSON object:
{
  "name": "Full Restaurant Name",
  "cuisine_type": "e.g. Mediterranean, Asian Fusion, Seafood",
  "description": "1-2 enticing sentences about the vibe and food",
  "tripadvisor_rating": 4.5,
  "tripadvisor_url": "https://www.tripadvisor.com/Restaurant-...",
  "image_url": "https://... (a representative photo URL)"
}

Rules:
- name: use the official full name of the restaurant
- tripadvisor_rating: a number like 4.5, or null if not found
- tripadvisor_url: the direct TripAdvisor review page URL, or null
- image_url: a direct image file URL ending in .jpg/.jpeg/.png/.webp (NOT a webpage URL), or null if no direct image URL is found
- description: focus on vibe, ambiance, and food style — make it sound appealing
- Return ONLY the JSON object`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return NextResponse.json({ error: "AI research failed" }, { status: 502 });
    }

    const data = await response.json();

    // Extract text from the response — Claude may return multiple content blocks
    // (tool_use, tool_result, text). We want the final text block.
    let textContent = "";
    for (const block of data.content ?? []) {
      if (block.type === "text") {
        textContent = block.text;
      }
    }

    if (!textContent) {
      return NextResponse.json({ error: "No response from AI" }, { status: 502 });
    }

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = textContent.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const result: ResearchResult = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (e) {
    console.error("Research error:", e);
    const msg = e instanceof Error ? e.message : "Research failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
