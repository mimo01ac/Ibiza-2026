-- Ibiza 2026 - Supabase Migration
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(auth_user_email);

-- ============================================
-- 2. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  club text NOT NULL,
  date date NOT NULL,
  time text,
  description text,
  ticket_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Deduplication index for scraper (prevents duplicate events by title+date+club)
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_dedup
ON events (lower(trim(title)), date, lower(trim(club)));

-- ============================================
-- 3. EVENT VOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_votes_event ON event_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_user ON event_votes(user_id);

-- ============================================
-- 4. EVENT COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_comments_entity ON event_comments(entity_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_user ON event_comments(user_id);

-- ============================================
-- 5. WILDCARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wildcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  submitted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wildcards_submitted_by ON wildcards(submitted_by);

-- ============================================
-- 6. WILDCARD VOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wildcard_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wildcard_id uuid NOT NULL REFERENCES wildcards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wildcard_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_wildcard_votes_wildcard ON wildcard_votes(wildcard_id);
CREATE INDEX IF NOT EXISTS idx_wildcard_votes_user ON wildcard_votes(user_id);

-- ============================================
-- 7. WILDCARD COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wildcard_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES wildcards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wildcard_comments_entity ON wildcard_comments(entity_id);
CREATE INDEX IF NOT EXISTS idx_wildcard_comments_user ON wildcard_comments(user_id);

-- ============================================
-- 8. FLIGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  arrival_date date NOT NULL,
  arrival_time text,
  departure_date date NOT NULL,
  departure_time text,
  flight_number_in text,
  flight_number_out text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flights_user ON flights(user_id);

-- ============================================
-- 9. ROOM ALLOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS room_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name text NOT NULL,
  description text,
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pre-seed rooms
INSERT INTO room_allocations (room_name, description) VALUES
  ('Master Bedroom', 'The largest room with en-suite bathroom'),
  ('Zjef Suite', 'Cozy room with garden view'),
  ('Future Garden Suite', 'Room overlooking the garden terrace'),
  ('Cool and Quiet Suite', 'The quietest room in the villa'),
  ('Theodors Suite', 'Classic room with character'),
  ('Gold''s Gym Suite', 'Room near the workout area')
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. GALLERY PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  file_url text NOT NULL,
  caption text,
  category text NOT NULL CHECK (category IN ('past_trips', 'ibiza_2026')),
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_photos(category);
CREATE INDEX IF NOT EXISTS idx_gallery_uploaded_by ON gallery_photos(uploaded_by);

-- ============================================
-- 11. RESTAURANTS TABLE
-- ============================================
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

-- ============================================
-- 12. RESTAURANT VOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_votes_restaurant ON restaurant_votes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_votes_user ON restaurant_votes(user_id);

-- ============================================
-- 13. RESTAURANT COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_comments_entity ON restaurant_comments(entity_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_comments_user ON restaurant_comments(user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER flights_updated_at
  BEFORE UPDATE ON flights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER room_allocations_updated_at
  BEFORE UPDATE ON room_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wildcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE wildcard_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wildcard_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (anon key)
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read event_votes" ON event_votes FOR SELECT USING (true);
CREATE POLICY "Public read event_comments" ON event_comments FOR SELECT USING (true);
CREATE POLICY "Public read wildcards" ON wildcards FOR SELECT USING (true);
CREATE POLICY "Public read wildcard_votes" ON wildcard_votes FOR SELECT USING (true);
CREATE POLICY "Public read wildcard_comments" ON wildcard_comments FOR SELECT USING (true);
CREATE POLICY "Public read flights" ON flights FOR SELECT USING (true);
CREATE POLICY "Public read room_allocations" ON room_allocations FOR SELECT USING (true);
CREATE POLICY "Public read gallery_photos" ON gallery_photos FOR SELECT USING (true);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Public read restaurant_votes" ON restaurant_votes FOR SELECT USING (true);
CREATE POLICY "Public read restaurant_comments" ON restaurant_comments FOR SELECT USING (true);

-- Note: All mutations go through API routes using the service role key,
-- so no INSERT/UPDATE/DELETE policies are needed for anon.

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Create these in the Supabase Dashboard under Storage:
-- 1. "dj-media" (public bucket)
-- 2. "gallery" (public bucket)
-- 3. "villa-photos" (public bucket)
--
-- For each bucket, add a public read policy:
-- Policy name: "Public read"
-- Allowed operation: SELECT
-- Policy: true (allow all)
