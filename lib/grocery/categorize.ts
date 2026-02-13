import type { GroceryCategory } from "@/lib/types/database";

const VALID_CATEGORIES: GroceryCategory[] = ["food_snacks", "drinks", "other"];

export async function categorizeItem(name: string): Promise<GroceryCategory> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "other";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 20,
        system:
          "You categorize grocery/shopping items. Reply with exactly one of: food_snacks, drinks, other. No explanation.",
        messages: [
          {
            role: "user",
            content: `Categorize this item: ${name}`,
          },
        ],
      }),
    });

    if (!response.ok) return "other";

    const data = await response.json();
    const text: string = (data.content?.[0]?.text ?? "").trim().toLowerCase();

    if (VALID_CATEGORIES.includes(text as GroceryCategory)) {
      return text as GroceryCategory;
    }

    return "other";
  } catch {
    return "other";
  }
}
