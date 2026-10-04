/*
# Restrict support_clicks reads to owner and admins

## Overview
The support_clicks table currently allows anyone (anon + authenticated) to read
all click data. This change restricts SELECT to only the creator who owns the
clicks and admins. Anonymous INSERT remains open so fans can record clicks
without logging in.

## Changes
1. Drop the existing "public_read_support_clicks" SELECT policy.
2. Add two new SELECT policies:
   - "read_own_support_clicks": authenticated users can read clicks on
     creators they own (creators.user_id = auth.uid()).
   - "admin_read_support_clicks": admins can read all clicks.
3. Keep the existing "anon_insert_support_clicks" INSERT policy unchanged.

## Important Notes
- The public directory still works — creator profiles, support methods, and
  social links remain publicly readable.
- Fans can still click support without logging in — the INSERT policy is unchanged.
- Only the creator themselves (or an admin) can see their analytics data.
*/

-- Drop the old public read policy
DROP POLICY IF EXISTS "public_read_support_clicks" ON support_clicks;

-- Owner can read their own support clicks (through creator ownership)
CREATE POLICY "read_own_support_clicks" ON support_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = support_clicks.creator_id
      AND creators.user_id = auth.uid()
    )
  );

-- Admins can read all support clicks
CREATE POLICY "admin_read_support_clicks" ON support_clicks FOR SELECT
  TO authenticated
  USING (is_admin());
