/**
 * Run with: npx tsx scripts/migrate-restaurants.ts
 * Creates the restaurants and restaurant_votes tables in Supabase.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually (no dotenv dependency needed)
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website_url text,
  image_url text,
  cuisine_type text,
  description text,
  tripadvisor_rating numeric(2,1),
  tripadvisor_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_restaurants_created_by ON restaurants(created_by);
CREATE TABLE IF NOT EXISTS restaurant_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_restaurant_votes_restaurant ON restaurant_votes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_votes_user ON restaurant_votes(user_id);
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_votes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'restaurants' AND policyname = 'Public read restaurants') THEN
    CREATE POLICY "Public read restaurants" ON restaurants FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'restaurant_votes' AND policyname = 'Public read restaurant_votes') THEN
    CREATE POLICY "Public read restaurant_votes" ON restaurant_votes FOR SELECT USING (true);
  END IF;
END $$;
`;

async function migrate() {
  console.log("Checking if tables already exist...");

  // Check if restaurants table exists by querying it
  const { error: checkErr } = await supabase
    .from("restaurants")
    .select("id")
    .limit(1);

  if (!checkErr) {
    const { error: checkVotesErr } = await supabase
      .from("restaurant_votes")
      .select("id")
      .limit(1);

    if (!checkVotesErr) {
      console.log("✅ Both tables already exist! Migration not needed.");
      return;
    }
  }

  console.log("Tables don't exist yet. Please run this SQL in your Supabase Dashboard SQL Editor:");
  console.log("\n" + "─".repeat(60));
  console.log(MIGRATION_SQL);
  console.log("─".repeat(60));
  console.log(`\nGo to: ${supabaseUrl.replace('.supabase.co', '')}/sql/new`);
  console.log("Or: https://supabase.com/dashboard → SQL Editor → New Query → Paste & Run");
}

migrate().catch(console.error);
