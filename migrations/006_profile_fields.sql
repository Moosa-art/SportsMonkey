-- ============================================================
-- Social 442 — Migration 006: Profile fields (Area 10 — Edit Profile)
-- Engine: MySQL 8.0+ AND MariaDB 10.4+ (portable, idempotent)
-- Run:  npm run migrate
-- ============================================================
-- Adds editable profile columns to `users` and seeds the local `teams`
-- table so the favourite-club / favourite-team pickers have real FK targets.
-- Uses the information_schema-guarded PREPARE/EXECUTE pattern (same as 005)
-- because MySQL 8 has no "ADD COLUMN IF NOT EXISTS". Safe to re-run.
-- ============================================================

-- ---- users.location ---------------------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'location');
SET @s := IF(@c = 0, 'ALTER TABLE users ADD COLUMN location VARCHAR(120) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- users.date_of_birth ----------------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'date_of_birth');
SET @s := IF(@c = 0, 'ALTER TABLE users ADD COLUMN date_of_birth DATE DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- users.favourite_team_id ------------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'favourite_team_id');
SET @s := IF(@c = 0, 'ALTER TABLE users ADD COLUMN favourite_team_id BIGINT UNSIGNED DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- users.username_changed_at (rate-limit username changes) ----
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username_changed_at');
SET @s := IF(@c = 0, 'ALTER TABLE users ADD COLUMN username_changed_at DATETIME DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- FK: users.favourite_team_id -> teams.id --------------------
SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'fk_users_fav_team');
SET @s := IF(@c = 0, 'ALTER TABLE users ADD CONSTRAINT fk_users_fav_team FOREIGN KEY (favourite_team_id) REFERENCES teams(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ============================================================
-- Seed popular clubs into the local teams table (FK target for the
-- club / team pickers). INSERT IGNORE keeps this idempotent on re-run.
-- ============================================================
INSERT IGNORE INTO teams (id, name, short_code, crest_url, primary_color, league, country) VALUES
  (1,  'Manchester United',      'MUN', 'https://cdn.sportmonks.com/images/soccer/teams/0/1.png',   '#DA291C', 'Premier League', 'England'),
  (2,  'Liverpool',              'LIV', 'https://cdn.sportmonks.com/images/soccer/teams/30/14.png', '#C8102E', 'Premier League', 'England'),
  (3,  'Chelsea',                'CHE', 'https://cdn.sportmonks.com/images/soccer/teams/4/4.png',   '#034694', 'Premier League', 'England'),
  (4,  'Manchester City',        'MCI', 'https://cdn.sportmonks.com/images/soccer/teams/11/43.png', '#6CABDD', 'Premier League', 'England'),
  (5,  'Arsenal',                'ARS', 'https://cdn.sportmonks.com/images/soccer/teams/10/42.png', '#EF0107', 'Premier League', 'England'),
  (6,  'Tottenham Hotspur',      'TOT', 'https://cdn.sportmonks.com/images/soccer/teams/15/47.png', '#132257', 'Premier League', 'England'),
  (7,  'Newcastle United',       'NEW', 'https://cdn.sportmonks.com/images/soccer/teams/2/34.png',  '#241F20', 'Premier League', 'England'),
  (8,  'Aston Villa',            'AVL', 'https://cdn.sportmonks.com/images/soccer/teams/23/55.png', '#95BFE5', 'Premier League', 'England'),
  (9,  'Everton',                'EVE', 'https://cdn.sportmonks.com/images/soccer/teams/17/17.png', '#003399', 'Premier League', 'England'),
  (10, 'Brighton & Hove Albion', 'BHA', 'https://cdn.sportmonks.com/images/soccer/teams/19/51.png', '#0057B8', 'Premier League', 'England'),
  (11, 'West Ham United',        'WHU', 'https://cdn.sportmonks.com/images/soccer/teams/1/19.png',  '#7A263A', 'Premier League', 'England'),
  (12, 'Blackburn Rovers',       'BLB', 'https://cdn.sportmonks.com/images/soccer/teams/22/278.png','#009EE0', 'Championship',   'England'),
  (13, 'Real Madrid',            'RMA', 'https://cdn.sportmonks.com/images/soccer/teams/3/83.png',  '#FEBE10', 'La Liga',        'Spain'),
  (14, 'Barcelona',              'BAR', 'https://cdn.sportmonks.com/images/soccer/teams/17/81.png', '#A50044', 'La Liga',        'Spain'),
  (15, 'Atletico Madrid',        'ATM', 'https://cdn.sportmonks.com/images/soccer/teams/13/13.png', '#CB3524', 'La Liga',        'Spain'),
  (16, 'Bayern Munich',          'BAY', 'https://cdn.sportmonks.com/images/soccer/teams/3/503.png', '#DC052D', 'Bundesliga',     'Germany'),
  (17, 'Borussia Dortmund',      'BVB', 'https://cdn.sportmonks.com/images/soccer/teams/4/68.png',  '#FDE100', 'Bundesliga',     'Germany'),
  (18, 'Juventus',               'JUV', 'https://cdn.sportmonks.com/images/soccer/teams/5/625.png', '#000000', 'Serie A',        'Italy'),
  (19, 'AC Milan',               'ACM', 'https://cdn.sportmonks.com/images/soccer/teams/2/602.png', '#FB090B', 'Serie A',        'Italy'),
  (20, 'Inter Milan',            'INT', 'https://cdn.sportmonks.com/images/soccer/teams/9/2930.png','#010E80', 'Serie A',        'Italy'),
  (21, 'Paris Saint-Germain',    'PSG', 'https://cdn.sportmonks.com/images/soccer/teams/8/591.png', '#004170', 'Ligue 1',        'France');
