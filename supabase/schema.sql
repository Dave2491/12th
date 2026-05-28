-- ============================================================
-- Twelfth — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── Tables ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fan_profiles (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address    TEXT    UNIQUE NOT NULL,
  country_code      TEXT    NOT NULL,
  display_name      TEXT,
  total_points      INTEGER DEFAULT 0,
  check_in_streak   INTEGER DEFAULT 0,
  longest_streak    INTEGER DEFAULT 0,
  last_fixture_id   INTEGER,
  badge_count       INTEGER DEFAULT 0,
  joined_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS check_ins (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_id          UUID    NOT NULL REFERENCES fan_profiles(id) ON DELETE CASCADE,
  fixture_id      INTEGER NOT NULL,
  points_earned   INTEGER DEFAULT 100,
  checked_in_at   TIMESTAMPTZ DEFAULT NOW()
);
-- One check-in per fan per fixture
CREATE UNIQUE INDEX IF NOT EXISTS check_ins_fan_fixture ON check_ins(fan_id, fixture_id);

CREATE TABLE IF NOT EXISTS quest_completions (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_id        UUID    NOT NULL REFERENCES fan_profiles(id) ON DELETE CASCADE,
  quest_id      TEXT    NOT NULL,
  fixture_id    INTEGER NOT NULL,
  answer        TEXT,
  points_earned INTEGER DEFAULT 0,
  completed_at  TIMESTAMPTZ DEFAULT NOW()
);
-- One completion per fan per quest
CREATE UNIQUE INDEX IF NOT EXISTS quest_completions_fan_quest ON quest_completions(fan_id, quest_id);

CREATE TABLE IF NOT EXISTS badges_earned (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_id      UUID    NOT NULL REFERENCES fan_profiles(id) ON DELETE CASCADE,
  badge_type  TEXT    NOT NULL,
  token_id    INTEGER,
  tx_hash     TEXT,
  earned_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS country_stats (
  country_code  TEXT    PRIMARY KEY,
  total_points  BIGINT  DEFAULT 0,
  fan_count     INTEGER DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── RPC: atomic country stat updates ─────────────────────────
-- Called from the client for fan registration and point awards.
-- Using ON CONFLICT + direct arithmetic avoids race conditions.

CREATE OR REPLACE FUNCTION increment_country_stats(
  p_country TEXT,
  p_points  INTEGER,
  p_fans    INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO country_stats (country_code, total_points, fan_count)
  VALUES (p_country, GREATEST(p_points, 0), GREATEST(p_fans, 0))
  ON CONFLICT (country_code) DO UPDATE
    SET total_points = country_stats.total_points + EXCLUDED.total_points,
        fan_count    = country_stats.fan_count    + EXCLUDED.fan_count,
        updated_at   = NOW();
END;
$$;

-- ── Disable RLS for hackathon (re-enable + add policies for prod) ──

ALTER TABLE fan_profiles      DISABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins         DISABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges_earned     DISABLE ROW LEVEL SECURITY;
ALTER TABLE country_stats     DISABLE ROW LEVEL SECURITY;
