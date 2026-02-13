-- Grocery & Drinks Shopping List - Supabase Migration
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. GROCERY ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS grocery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('food_snacks', 'drinks', 'other')),
  quantity integer NOT NULL DEFAULT 1,
  is_purchased boolean NOT NULL DEFAULT false,
  added_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  purchased_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grocery_items_added_by ON grocery_items(added_by);
CREATE INDEX IF NOT EXISTS idx_grocery_items_category ON grocery_items(category);

-- Dedup: prevent duplicate unpurchased items with same name+category
CREATE UNIQUE INDEX IF NOT EXISTS idx_grocery_items_dedup
ON grocery_items (lower(trim(name)), category) WHERE is_purchased = false;

-- ============================================
-- 2. GROCERY ITEM VOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS grocery_item_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_item_id uuid NOT NULL REFERENCES grocery_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(grocery_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_grocery_item_votes_item ON grocery_item_votes(grocery_item_id);
CREATE INDEX IF NOT EXISTS idx_grocery_item_votes_user ON grocery_item_votes(user_id);

-- ============================================
-- 3. TRIGGERS
-- ============================================
CREATE TRIGGER grocery_items_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_item_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read grocery_items" ON grocery_items FOR SELECT USING (true);
CREATE POLICY "Public read grocery_item_votes" ON grocery_item_votes FOR SELECT USING (true);
