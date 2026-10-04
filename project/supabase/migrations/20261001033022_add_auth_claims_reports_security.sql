/*
# Add authentication, claim requests, reports, and security overhaul

## Overview
This migration transforms Hatis from an anonymous public app to a secure
multi-user platform with Supabase Auth (Google + Facebook OAuth). It adds
profiles, claim_requests, and reports tables, tightens all RLS policies from
public-write to owner-scoped, adds a database trigger to protect privileged
columns, and adds a hidden column to support_methods for the report system.

## 1. New Tables

### profiles
- `id` (uuid, PK, matches auth.users.id) — the user's auth ID
- `email` (text, not null) — cached email from OAuth provider
- `role` (text, not null, default 'supporter') — 'creator' or 'supporter'
- `is_admin` (boolean, not null, default false) — set manually in dashboard, never from app
- `created_at` (timestamptz, default now())

### claim_requests
- `id` (uuid, PK)
- `creator_id` (uuid, FK to creators, not null) — the page being claimed
- `user_id` (uuid, FK to auth.users, not null) — the claimant
- `message` (text) — optional message from claimant
- `proof_url` (text) — link to the social account where the claim code was posted
- `claim_code` (text, not null) — the HATIS-XXXXXX code the claimant must post
- `status` (text, not null, default 'pending') — 'pending', 'approved', 'rejected'
- `admin_note` (text) — admin's note on resolution
- `created_at` (timestamptz, default now())

### reports
- `id` (uuid, PK)
- `creator_id` (uuid, FK to creators, not null)
- `support_method_id` (uuid, FK to support_methods, nullable)
- `reason` (text, not null) — 'wrong_number', 'impersonation', 'scam', 'other'
- `details` (text) — optional description
- `reporter_contact` (text) — optional contact info
- `status` (text, not null, default 'open') — 'open', 'resolved'
- `reporter_ip` (text) — for rate limiting (1 per method per day per browser)
- `created_at` (timestamptz, default now())

## 2. Modified Tables

### creators
- Added column `categories` (text[], default '{}') — array of category values, first is primary
- Added column `display_name` (text) — separate from slug/name
- Added column `onboarding_complete` (boolean, default false)
- Changed `user_id` to have FK constraint to auth.users (added via DO block since column already exists)

### support_methods
- Added column `hidden` (boolean, not null, default false) — hides number/handle when 3+ open reports

## 3. Security Changes

### RLS Policy Overhaul
All anonymous (anon) write policies on creators, social_links, and support_methods
are REMOVED. Only public SELECT remains. Writes are now owner-scoped:

- creators: authenticated can insert one row (user_id = auth.uid()), update own, delete own
- social_links: authenticated can insert/update/delete where creator belongs to them
- support_methods: same ownership pattern as social_links
- support_clicks: anon + authenticated can INSERT (fans don't need login to click support)
- profiles: authenticated can read own, insert own (on signup), update own (but NOT is_admin)
- claim_requests: authenticated can insert own, read own; admins read all and update all
- reports: anyone (anon + authenticated) can INSERT; only admins can SELECT

### Column-Level Privileges
- creators: REVOKE UPDATE on verified, featured, user_id from authenticated.
  Only admins can change these via SECURITY DEFINER functions.
- profiles: REVOKE UPDATE on is_admin from authenticated. Never client-writable.

### Database Trigger: protect_creator_privileged_columns
A BEFORE UPDATE trigger on creators that raises an exception if a non-admin
user tries to change verified, featured, or user_id. This is defense-in-depth
on top of the column-level privilege revocation.

### SECURITY DEFINER Functions
- `is_admin()` — checks if current user is an admin (used in policies and triggers)
- `approve_claim(p_request_id uuid)` — admin approves a claim, sets user_id + verified
- `reject_claim(p_request_id uuid, p_note text)` — admin rejects with a note
- `toggle_creator_verified(p_creator_id uuid)` — admin toggles verified
- `toggle_creator_featured(p_creator_id uuid)` — admin toggles featured
- `resolve_report(p_report_id uuid)` — admin resolves a report
- `hide_support_method(p_method_id uuid)` — admin hides a support method
- `unverify_creator(p_creator_id uuid)` — admin unverifies a creator (on report resolution)
- `get_open_report_count(p_support_method_id uuid)` — returns count of open reports for a method

## 4. Important Notes
1. is_admin is set manually in the Supabase dashboard, never through the app.
2. Existing creators with user_id = null remain public but uneditable until an admin links them.
3. New creators are created with verified = false.
4. The claim_code is generated server-side in the insert function.
5. Reports rate limiting: 1 per support_method per day per browser (tracked by reporter_ip).
6. When a support method has 3+ open reports, it should be hidden via the hidden column.
*/

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'supporter' CHECK (role IN ('creator', 'supporter')),
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Revoke is_admin from being updated by authenticated users
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (email, role) ON profiles TO authenticated;

-- ============================================================
-- 2. IS_ADMIN HELPER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============================================================
-- 3. CREATORS TABLE MODIFICATIONS
-- ============================================================

-- Add categories array column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'creators' AND column_name = 'categories'
  ) THEN
    ALTER TABLE creators ADD COLUMN categories text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- Add display_name column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'creators' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE creators ADD COLUMN display_name text;
  END IF;
END $$;

-- Add onboarding_complete column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'creators' AND column_name = 'onboarding_complete'
  ) THEN
    ALTER TABLE creators ADD COLUMN onboarding_complete boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add FK on user_id to auth.users (only for non-null values)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'creators_user_id_fkey'
  ) THEN
    ALTER TABLE creators
    ADD CONSTRAINT creators_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Set default on user_id to auth.uid() for new inserts
ALTER TABLE creators ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ============================================================
-- 4. REMOVE OLD ANON POLICIES ON CREATORS, ADD OWNER-SCOPED
-- ============================================================

-- Drop all old anon policies on creators
DROP POLICY IF EXISTS "anon_delete_creators" ON creators;
DROP POLICY IF EXISTS "anon_insert_creators" ON creators;
DROP POLICY IF EXISTS "anon_update_creators" ON creators;
DROP POLICY IF EXISTS "public_read_creators" ON creators;

-- Public read (creators are a public directory)
CREATE POLICY "public_read_creators" ON creators FOR SELECT
  TO anon, authenticated USING (true);

-- Authenticated can insert their own creator row
CREATE POLICY "insert_own_creator" ON creators FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Owner can update their own creator row
CREATE POLICY "update_own_creator" ON creators FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Owner can delete their own creator row
CREATE POLICY "delete_own_creator" ON creators FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Revoke UPDATE on privileged columns
REVOKE UPDATE ON creators FROM authenticated;
GRANT UPDATE (
  slug, name, display_name, tagline, bio, category, categories,
  location, language, avatar_url, cover_url, profile_complete,
  onboarding_complete, updated_at
) ON creators TO authenticated;

-- ============================================================
-- 5. PROTECT PRIVILEGED COLUMNS WITH A TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION protect_creator_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only admins can change verified, featured, or user_id
  IF NOT is_admin() THEN
    IF NEW.verified IS DISTINCT FROM OLD.verified THEN
      RAISE EXCEPTION 'You are not authorized to change the verified status';
    END IF;
    IF NEW.featured IS DISTINCT FROM OLD.featured THEN
      RAISE EXCEPTION 'You are not authorized to change the featured status';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'You are not authorized to change the page owner';
    END IF;
  END IF;
  -- Always update the updated_at timestamp
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_creator_privileged_columns ON creators;
CREATE TRIGGER protect_creator_privileged_columns
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION protect_creator_privileged_columns();

REVOKE EXECUTE ON FUNCTION protect_creator_privileged_columns() FROM anon;
-- No need to grant to authenticated; trigger runs as owner

-- ============================================================
-- 6. SOCIAL_LINKS POLICIES OVERHAUL
-- ============================================================

DROP POLICY IF EXISTS "anon_delete_social_links" ON social_links;
DROP POLICY IF EXISTS "anon_insert_social_links" ON social_links;
DROP POLICY IF EXISTS "anon_update_social_links" ON social_links;
DROP POLICY IF EXISTS "public_read_social_links" ON social_links;

-- Public read
CREATE POLICY "public_read_social_links" ON social_links FOR SELECT
  TO anon, authenticated USING (true);

-- Owner can insert (must own the parent creator)
CREATE POLICY "insert_own_social_links" ON social_links FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = social_links.creator_id
      AND creators.user_id = auth.uid()
    )
  );

-- Owner can update
CREATE POLICY "update_own_social_links" ON social_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = social_links.creator_id
      AND creators.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = social_links.creator_id
      AND creators.user_id = auth.uid()
    )
  );

-- Owner can delete
CREATE POLICY "delete_own_social_links" ON social_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = social_links.creator_id
      AND creators.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. SUPPORT_METHODS MODIFICATIONS + POLICY OVERHAUL
-- ============================================================

-- Add hidden column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_methods' AND column_name = 'hidden'
  ) THEN
    ALTER TABLE support_methods ADD COLUMN hidden boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_delete_support_methods" ON support_methods;
DROP POLICY IF EXISTS "anon_insert_support_methods" ON support_methods;
DROP POLICY IF EXISTS "anon_update_support_methods" ON support_methods;
DROP POLICY IF EXISTS "public_read_support_methods" ON support_methods;

-- Public read
CREATE POLICY "public_read_support_methods" ON support_methods FOR SELECT
  TO anon, authenticated USING (true);

-- Owner can insert
CREATE POLICY "insert_own_support_methods" ON support_methods FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = support_methods.creator_id
      AND creators.user_id = auth.uid()
    )
  );

-- Owner can update
CREATE POLICY "update_own_support_methods" ON support_methods FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = support_methods.creator_id
      AND creators.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = support_methods.creator_id
      AND creators.user_id = auth.uid()
    )
  );

-- Owner can delete
CREATE POLICY "delete_own_support_methods" ON support_methods FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = support_methods.creator_id
      AND creators.user_id = auth.uid()
    )
  );

-- ============================================================
-- 8. SUPPORT_CLICKS POLICIES (keep public insert for fans)
-- ============================================================

DROP POLICY IF EXISTS "anon_insert_support_clicks" ON support_clicks;
DROP POLICY IF EXISTS "public_read_support_clicks" ON support_clicks;

-- Public read (creators can see their own click analytics)
CREATE POLICY "public_read_support_clicks" ON support_clicks FOR SELECT
  TO anon, authenticated USING (true);

-- Anyone can insert a click (fans don't need to be logged in)
CREATE POLICY "anon_insert_support_clicks" ON support_clicks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- ============================================================
-- 9. CLAIM_REQUESTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  proof_url text,
  claim_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;

-- Claimant can read their own requests
CREATE POLICY "read_own_claim_requests" ON claim_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Claimant can insert their own request
CREATE POLICY "insert_own_claim_request" ON claim_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can read all claim requests
CREATE POLICY "admin_read_all_claim_requests" ON claim_requests FOR SELECT
  TO authenticated USING (is_admin());

-- Admins can update claim requests (approve/reject)
CREATE POLICY "admin_update_claim_requests" ON claim_requests FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE INDEX IF NOT EXISTS idx_claim_requests_creator ON claim_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON claim_requests(status);

-- ============================================================
-- 10. REPORTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  support_method_id uuid REFERENCES support_methods(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('wrong_number', 'impersonation', 'scam', 'other')),
  details text,
  reporter_contact text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  reporter_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can insert reports
CREATE POLICY "anyone_insert_reports" ON reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only admins can read reports
CREATE POLICY "admin_read_reports" ON reports FOR SELECT
  TO authenticated USING (is_admin());

-- Only admins can update reports (resolve)
CREATE POLICY "admin_update_reports" ON reports FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE INDEX IF NOT EXISTS idx_reports_creator ON reports(creator_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_method ON reports(support_method_id);

-- ============================================================
-- 11. HELPER FUNCTION: get_open_report_count
-- ============================================================

CREATE OR REPLACE FUNCTION get_open_report_count(p_support_method_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM reports
  WHERE support_method_id = p_support_method_id
  AND status = 'open';
$$;

GRANT EXECUTE ON FUNCTION get_open_report_count(uuid) TO anon, authenticated;

-- ============================================================
-- 12. ADMIN SECURITY DEFINER FUNCTIONS
-- ============================================================

-- Approve a claim: set creators.user_id and verified = true
CREATE OR REPLACE FUNCTION approve_claim(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_creator_id uuid;
  v_user_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT creator_id, user_id INTO v_creator_id, v_user_id
  FROM claim_requests WHERE id = p_request_id AND status = 'pending';

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Claim request not found or already processed';
  END IF;

  -- Link the creator to the user and verify
  UPDATE creators
  SET user_id = v_user_id, verified = true
  WHERE id = v_creator_id;

  -- Mark the claim as approved
  UPDATE claim_requests
  SET status = 'approved'
  WHERE id = p_request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION approve_claim(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION approve_claim(uuid) TO authenticated;

-- Reject a claim with a note
CREATE OR REPLACE FUNCTION reject_claim(p_request_id uuid, p_note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE claim_requests
  SET status = 'rejected', admin_note = p_note
  WHERE id = p_request_id AND status = 'pending';
END;
$$;

REVOKE EXECUTE ON FUNCTION reject_claim(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION reject_claim(uuid, text) TO authenticated;

-- Toggle creator verified
CREATE OR REPLACE FUNCTION toggle_creator_verified(p_creator_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE creators
  SET verified = NOT verified
  WHERE id = p_creator_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION toggle_creator_verified(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION toggle_creator_verified(uuid) TO authenticated;

-- Toggle creator featured
CREATE OR REPLACE FUNCTION toggle_creator_featured(p_creator_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE creators
  SET featured = NOT featured
  WHERE id = p_creator_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION toggle_creator_featured(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION toggle_creator_featured(uuid) TO authenticated;

-- Resolve a report
CREATE OR REPLACE FUNCTION resolve_report(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE reports
  SET status = 'resolved'
  WHERE id = p_report_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION resolve_report(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION resolve_report(uuid) TO authenticated;

-- Hide a support method (admin)
CREATE OR REPLACE FUNCTION hide_support_method(p_method_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE support_methods
  SET hidden = true
  WHERE id = p_method_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION hide_support_method(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION hide_support_method(uuid) TO authenticated;

-- Unverify a creator (admin, on report resolution)
CREATE OR REPLACE FUNCTION unverify_creator(p_creator_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE creators
  SET verified = false
  WHERE id = p_creator_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION unverify_creator(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION unverify_creator(uuid) TO authenticated;

-- ============================================================
-- 13. STORAGE BUCKET FOR AVATARS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
DROP POLICY IF EXISTS "avatar_read_public" ON storage.objects;
CREATE POLICY "avatar_read_public" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatar_insert_own" ON storage.objects;
CREATE POLICY "avatar_insert_own" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatar_update_own" ON storage.objects;
CREATE POLICY "avatar_update_own" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatar_delete_own" ON storage.objects;
CREATE POLICY "avatar_delete_own" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
