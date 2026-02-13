import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    await getSessionOrThrow();

    const { arrival_date, departure_date } = await req.json();
    if (!arrival_date || !departure_date) {
      return NextResponse.json(
        { error: "arrival_date and departure_date are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI search is not configured. Add ANTHROPIC_API_KEY to environment." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 10,
          },
        ],
        system: `You are a flight search assistant. Your job is to search the web for round-trip flights from Copenhagen (CPH) to Ibiza (IBZ).

IMPORTANT: There are almost NO direct flights from CPH to IBZ. Most routes connect via Barcelona (BCN), Palma de Mallorca (PMI), Madrid (MAD), Amsterdam (AMS), or other European hubs. You MUST include connecting flights with 1 stop — these are the most common and expected results.

Search strategy:
1. Search Skyscanner, Google Flights, Kayak, or Momondo for "Copenhagen to Ibiza" on the given dates
2. Look for both direct flights (rare, seasonal) AND 1-stop connections
3. Common connecting routes: CPH→BCN→IBZ, CPH→PMI→IBZ, CPH→MAD→IBZ, CPH→AMS→IBZ
4. Airlines to look for: SAS, Vueling, Ryanair, EasyJet, Norwegian, Transavia, Eurowings, Iberia
5. If exact date results are unavailable, search for nearby dates and note this

You MUST return 3-6 packages. If 2026 flights are not yet bookable, return the best available options based on current/seasonal schedules with estimated prices, and explain in data_freshness.

Always respond with ONLY a valid JSON object (no markdown, no code blocks).`,
        messages: [
          {
            role: "user",
            content: `Find round-trip flights from Copenhagen (CPH) to Ibiza (IBZ):
- Outbound date: ${arrival_date}
- Return date: ${departure_date}

Search on Google Flights, Skyscanner, or Kayak for "flights Copenhagen to Ibiza ${arrival_date}" and "flights Ibiza to Copenhagen ${departure_date}". Include 1-stop connecting flights — direct flights are rare on this route.

Return JSON in this exact format:
{
  "packages": [
    {
      "outbound": {
        "airline": "Vueling + SAS",
        "flight_number": "VY1234 / SK567",
        "departure_airport": "CPH",
        "arrival_airport": "IBZ",
        "departure_time": "06:30",
        "arrival_time": "12:15",
        "duration": "5h 45m",
        "stops": 1,
        "stop_cities": ["Barcelona"]
      },
      "inbound": {
        "airline": "Ryanair + Norwegian",
        "flight_number": "FR890 / DY123",
        "departure_airport": "IBZ",
        "arrival_airport": "CPH",
        "departure_time": "15:00",
        "arrival_time": "21:30",
        "duration": "6h 30m",
        "stops": 1,
        "stop_cities": ["Madrid"]
      },
      "price_eur": 220
    }
  ],
  "data_freshness": "Based on searches in Feb 2026. Prices are estimates and may vary.",
  "search_summary": "Found 5 round-trip options CPH↔IBZ, mostly via Barcelona and Madrid"
}

Rules:
- price_eur: estimated round-trip price per person in EUR
- stops: 0 for direct, 1 for one stop
- stop_cities: layover city names (e.g. ["Barcelona"])
- For connecting flights, combine airline names with " + " and flight numbers with " / "
- data_freshness: note if schedules are estimated or not yet released
- MUST return at least 3 packages, prefer 4-6
- Sort by price ascending
- Return ONLY the JSON object, nothing else`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return NextResponse.json({ error: "AI flight search failed" }, { status: 502 });
    }

    const data = await response.json();

    // Extract the last text block from response
    let textContent = "";
    for (const block of data.content ?? []) {
      if (block.type === "text") {
        textContent = block.text;
      }
    }

    if (!textContent) {
      console.error("No text in AI response. Content blocks:", JSON.stringify(data.content?.map((b: { type: string }) => b.type)));
      return NextResponse.json({ error: "No response from AI" }, { status: 502 });
    }

    // Extract JSON from response
    let jsonStr = textContent.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response as JSON:", textContent.slice(0, 500));
      return NextResponse.json({ error: "Could not parse flight results" }, { status: 502 });
    }

    // Ensure packages array exists
    if (!result.packages || !Array.isArray(result.packages)) {
      result = { packages: [], data_freshness: result.data_freshness || "Unknown", search_summary: result.search_summary || "No results" };
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("Flight search error:", e);
    const msg = e instanceof Error ? e.message : "Flight search failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
