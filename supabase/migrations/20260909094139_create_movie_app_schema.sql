/*
# Telugu Movie Recommendation App — Schema

1. Overview
   This app lets users browse Telugu movies, rate them, add to a watchlist,
   and get personalized recommendations based on their ratings.

2. New Tables
   - `movies` — catalogue of Telugu movies
     - id, title, year, director, lead_actors (text[]), genres (text[]),
       language, rating, runtime, poster_url, backdrop_url, synopsis, trailer_url, created_at
   - `ratings` — a user's 1-5 star rating of a movie (owner-scoped)
   - `watchlist` — movies a user wants to watch (owner-scoped)

3. Security
   - `movies` readable by everyone (anon + authenticated); insert/update/delete
     open to authenticated for future admin use.
   - `ratings` and `watchlist` owner-scoped via auth.uid() with DEFAULT auth.uid().
   - RLS enabled on all three tables.
*/

-- =============================================================
-- movies
-- =============================================================
CREATE TABLE IF NOT EXISTS movies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  year         int,
  director     text,
  lead_actors  text[] DEFAULT '{}',
  genres       text[] DEFAULT '{}',
  language     text NOT NULL DEFAULT 'Telugu',
  rating       numeric(3,1) DEFAULT 0,
  runtime      int,
  poster_url   text,
  backdrop_url text,
  synopsis     text,
  trailer_url  text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "movies_select_all" ON movies;
CREATE POLICY "movies_select_all" ON movies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "movies_insert_auth" ON movies;
CREATE POLICY "movies_insert_auth" ON movies FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "movies_update_auth" ON movies;
CREATE POLICY "movies_update_auth" ON movies FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "movies_delete_auth" ON movies;
CREATE POLICY "movies_delete_auth" ON movies FOR DELETE
  TO authenticated USING (true);

-- =============================================================
-- ratings
-- =============================================================
CREATE TABLE IF NOT EXISTS ratings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  score      int NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ratings_select_own" ON ratings;
CREATE POLICY "ratings_select_own" ON ratings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ratings_insert_own" ON ratings;
CREATE POLICY "ratings_insert_own" ON ratings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ratings_update_own" ON ratings;
CREATE POLICY "ratings_update_own" ON ratings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ratings_delete_own" ON ratings;
CREATE POLICY "ratings_delete_own" ON ratings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================================
-- watchlist
-- =============================================================
CREATE TABLE IF NOT EXISTS watchlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watchlist_select_own" ON watchlist;
CREATE POLICY "watchlist_select_own" ON watchlist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "watchlist_insert_own" ON watchlist;
CREATE POLICY "watchlist_insert_own" ON watchlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "watchlist_update_own" ON watchlist;
CREATE POLICY "watchlist_update_own" ON watchlist FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "watchlist_delete_own" ON watchlist;
CREATE POLICY "watchlist_delete_own" ON watchlist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================================
-- Indexes
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_movie ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies USING gin(genres);
