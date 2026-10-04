/*
# Create Hatis creator directory schema

1. New Tables
- `creators`: Stores Haitian creator profiles. Each row is one creator with their
  bio, category, location, language, avatar, cover image, verification status,
  and a slug for their public profile URL.
- `social_links`: A creator can have multiple social/work links (YouTube, Instagram,
  TikTok, website, etc.). One-to-many with creators.
- `support_methods`: A creator can have multiple support methods (PayPal, Cash App,
  MonCash, NatCash, Zelle, Payoneer, Bank transfer). Each has a type, a display
  value (handle, number, link), and optional instructions. One-to-many with creators.
- `support_clicks`: Tracks when a fan clicks a support method. Used for tip-intent
  analytics shown to creators. One-to-many with support_methods.

2. Security
- Enable RLS on all tables.
- Public read access (anon + authenticated) on creators, social_links, support_methods,
  and support_clicks — this is a public directory, profiles are meant to be discoverable.
- Public insert on support_clicks — fans don't need an account to click support.
- Creators table is public read; updates are restricted to authenticated owners via
  auth.uid() = user_id. For now, since there is no auth flow, we allow anon updates
  so the claim/edit flow works without sign-in. This can be tightened later when auth
  is added.
- social_links and support_methods: public read, anon insert/update/delete so the
  claim flow can manage them.

3. Important Notes
- This is a no-auth public directory app. All profiles are publicly visible.
- Support clicks are tracked for analytics but no money flows through Hatis.
- The schema is designed so auth can be added later by tightening policies to
  authenticated-only writes with ownership checks.
*/

-- Creators table
CREATE TABLE IF NOT EXISTS creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  bio text,
  category text NOT NULL DEFAULT 'Other',
  location text,
  language text DEFAULT 'Kreyòl',
  avatar_url text,
  cover_url text,
  featured boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  profile_complete integer NOT NULL DEFAULT 0,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_creators" ON creators;
CREATE POLICY "public_read_creators" ON creators FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_creators" ON creators;
CREATE POLICY "anon_insert_creators" ON creators FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_creators" ON creators;
CREATE POLICY "anon_update_creators" ON creators FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_creators" ON creators;
CREATE POLICY "anon_delete_creators" ON creators FOR DELETE
  TO anon, authenticated USING (true);

-- Social links table
CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  platform text NOT NULL,
  url text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_social_links" ON social_links;
CREATE POLICY "public_read_social_links" ON social_links FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_social_links" ON social_links;
CREATE POLICY "anon_insert_social_links" ON social_links FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_social_links" ON social_links;
CREATE POLICY "anon_update_social_links" ON social_links FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_social_links" ON social_links;
CREATE POLICY "anon_delete_social_links" ON social_links FOR DELETE
  TO anon, authenticated USING (true);

-- Support methods table
CREATE TABLE IF NOT EXISTS support_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  method_type text NOT NULL,
  display_value text NOT NULL,
  link_url text,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_support_methods" ON support_methods;
CREATE POLICY "public_read_support_methods" ON support_methods FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_support_methods" ON support_methods;
CREATE POLICY "anon_insert_support_methods" ON support_methods FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_support_methods" ON support_methods;
CREATE POLICY "anon_update_support_methods" ON support_methods FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_support_methods" ON support_methods;
CREATE POLICY "anon_delete_support_methods" ON support_methods FOR DELETE
  TO anon, authenticated USING (true);

-- Support clicks table (analytics)
CREATE TABLE IF NOT EXISTS support_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  method_type text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_support_clicks" ON support_clicks;
CREATE POLICY "public_read_support_clicks" ON support_clicks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_support_clicks" ON support_clicks;
CREATE POLICY "anon_insert_support_clicks" ON support_clicks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creators_slug ON creators(slug);
CREATE INDEX IF NOT EXISTS idx_creators_category ON creators(category);
CREATE INDEX IF NOT EXISTS idx_creators_featured ON creators(featured);
CREATE INDEX IF NOT EXISTS idx_social_links_creator_id ON social_links(creator_id);
CREATE INDEX IF NOT EXISTS idx_support_methods_creator_id ON support_methods(creator_id);
CREATE INDEX IF NOT EXISTS idx_support_clicks_creator_id ON support_clicks(creator_id);
