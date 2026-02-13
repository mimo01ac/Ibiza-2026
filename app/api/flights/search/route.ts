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
        system: `You are a flight search assistant. Search the web for round-trip flights from Copenhagen (CPH) to Ibiza (IBZ).

Rules:
- Search for flights on the specific dates provided
- Look for flights with max 1 stop and under 8 hours each way
- Find 3-6 different trip packages sorted by price (cheapest first)
- Include airlines like SAS, Ryanair, EasyJet, Vueling, Norwegian, Transavia, etc.
- For each package, provide both outbound (CPH→IBZ) and inbound (IBZ→CPH) legs
- If 2026 flights are not yet available for booking, note this clearly in data_freshness

Always respond with ONLY a valid JSON object (no markdown, no code blocks, no explanation).`,
        messages: [
          {
            role: "user",
            content: `Search for round-trip flights:
- Outbound: Copenhagen (CPH) → Ibiza (IBZ) on ${arrival_date}
- Return: Ibiza (IBZ) → Copenhagen (CPH) on ${departure_date}

Return as JSON:
{
  "packages": [
    {
      "outbound": {
        "airline": "Airline Name",
        "flight_number": "XX123",
        "departure_airport": "CPH",
        "arrival_airport": "IBZ",
        "departure_time": "08:30",
        "arrival_time": "12:15",
        "duration": "3h 45m",
        "stops": 0,
        "stop_cities": []
      },
      "inbound": {
        "airline": "Airline Name",
        "flight_number": "XX456",
        "departure_airport": "IBZ",
        "arrival_airport": "CPH",
        "departure_time": "15:00",
        "arrival_time": "19:30",
        "duration": "4h 30m",
        "stops": 1,
        "stop_cities": ["Barcelona"]
      },
      "price_eur": 250
    }
  ],
  "data_freshness": "Prices from February 2026 searches. Schedules and prices may change.",
  "search_summary": "Found 4 round-trip options from CPH to IBZ"
}

Rules:
- price_eur: estimated round-trip price per person in EUR
- stops: 0 for direct, 1 for one stop, etc.
- stop_cities: array of layover city names (empty for direct)
- data_freshness: note if 2026 schedules are not yet fully released
- Return ONLY the JSON object`,
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
      return NextResponse.json({ error: "No response from AI" }, { status: 502 });
    }

    // Extract JSON from response
    let jsonStr = textContent.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (e) {
    console.error("Flight search error:", e);
    const msg = e instanceof Error ? e.message : "Flight search failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
