import { NextResponse } from "next/server";
import { getSessionOrThrow, requireAdmin } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

const SEED_RESTAURANTS = [
  {
    name: "Jul's",
    website_url: "https://julsibiza.com",
    image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    cuisine_type: "Mediterranean",
    description: "A bohemian-chic hideaway in Santa Gertrudis serving farm-to-table Mediterranean dishes with a creative twist. Perfect for long sunset dinners with friends.",
    tripadvisor_rating: 4.5,
    tripadvisor_url: "https://www.tripadvisor.com/Restaurant_Review-g580094-d8820775-Reviews-Jul_s-Santa_Gertrudis_de_Fruitera_Ibiza_Balearic_Islands.html",
  },
  {
    name: "Bambuddha",
    website_url: "https://bambuddha.com",
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    cuisine_type: "Asian Fusion",
    description: "Iconic Ibiza dining in a stunning bamboo temple setting. Asian-fusion flavors meet tropical garden vibes — a must-visit for the full island experience.",
    tripadvisor_rating: 4.0,
    tripadvisor_url: "https://www.tripadvisor.com/Restaurant_Review-g187460-d1084722-Reviews-Bambuddha-Ibiza_Town_Ibiza_Balearic_Islands.html",
  },
  {
    name: "CBbC",
    website_url: "https://cbbc.es",
    image_url: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80",
    cuisine_type: "Japanese-Peruvian",
    description: "Cala Bonita Beach Club meets Nikkei cuisine — fresh ceviches, sashimi, and Peruvian-Japanese bites right on the sand with panoramic sea views.",
    tripadvisor_rating: 4.0,
    tripadvisor_url: "https://www.tripadvisor.com/Restaurant_Review-g187460-d7181085-Reviews-CBbC-Ibiza_Town_Ibiza_Balearic_Islands.html",
  },
  {
    name: "La Oliva",
    website_url: "https://laoliva-ibiza.com",
    image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    cuisine_type: "French-Mediterranean",
    description: "Tucked in the charming streets of Dalt Vila, La Oliva delivers elegant French-Mediterranean plates in a romantic candlelit courtyard setting.",
    tripadvisor_rating: 4.5,
    tripadvisor_url: "https://www.tripadvisor.com/Restaurant_Review-g187460-d697578-Reviews-La_Oliva-Ibiza_Town_Ibiza_Balearic_Islands.html",
  },
];

export async function POST() {
  try {
    const session = await getSessionOrThrow();
    const profile = await requireAdmin(session.user!.email!);

    const supabase = createAdminClient();

    // Check if restaurants already seeded
    const { count } = await supabase
      .from("restaurants")
      .select("*", { count: "exact", head: true });

    if ((count ?? 0) > 0) {
      return NextResponse.json({ message: "Restaurants already seeded", count });
    }

    const { data, error } = await supabase
      .from("restaurants")
      .insert(
        SEED_RESTAURANTS.map((r) => ({
          ...r,
          created_by: profile.id,
        }))
      )
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Seeded successfully", restaurants: data }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
