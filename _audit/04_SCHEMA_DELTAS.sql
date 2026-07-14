-- ============================================================
-- Social 442 — Schema deltas required by the audit plan
--
-- This file is NOT applied automatically. Review, then run with:
--   mysql -u <user> -p social442 < _audit/04_SCHEMA_DELTAS.sql
--
-- All statements are idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- where MySQL 8.0 supports it). Re-running is safe.
-- ============================================================

USE social442;

-- ───────────────────────────────────────────────────────────
-- Area 10 — Edit Profile: add missing user columns
-- ───────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS location          VARCHAR(120)    DEFAULT NULL AFTER bio,
  ADD COLUMN IF NOT EXISTS date_of_birth     DATE            DEFAULT NULL AFTER location,
  ADD COLUMN IF NOT EXISTS favourite_team_id BIGINT UNSIGNED DEFAULT NULL AFTER favourite_club_id,
  ADD COLUMN IF NOT EXISTS username_changed_at DATETIME      DEFAULT NULL,  -- rate-limit username changes
  ADD COLUMN IF NOT EXISTS privacy_settings  JSON            DEFAULT NULL;

-- Add FK for favourite_team_id (mirrors favourite_club_id pattern)
-- Drop existing constraint if re-running to avoid duplicate-name errors
SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND CONSTRAINT_NAME = 'fk_users_team'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_team FOREIGN KEY (favourite_team_id) REFERENCES teams(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ───────────────────────────────────────────────────────────
-- Area 4 — Shares + Reposts
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shares (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  post_id     BIGINT UNSIGNED NOT NULL,
  channel     ENUM('copy','native','whatsapp','telegram','twitter','facebook',
                   'email','feed','story','chat') NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_shares_post (post_id),
  INDEX idx_shares_user (user_id, created_at DESC)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reposts (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  post_id     BIGINT UNSIGNED NOT NULL,
  caption     VARCHAR(280) DEFAULT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_repost (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_reposts_user (user_id, created_at DESC)
) ENGINE=InnoDB;

-- Trigger: keep posts.share_count in sync with shares + reposts
-- (drop & recreate to ensure idempotence)
DROP TRIGGER IF EXISTS trg_share_ins;
DROP TRIGGER IF EXISTS trg_repost_ins;
DROP TRIGGER IF EXISTS trg_repost_del;

DELIMITER $$
CREATE TRIGGER trg_share_ins
  AFTER INSERT ON shares FOR EACH ROW
BEGIN
  UPDATE posts SET share_count = share_count + 1 WHERE id = NEW.post_id;
END$$

CREATE TRIGGER trg_repost_ins
  AFTER INSERT ON reposts FOR EACH ROW
BEGIN
  UPDATE posts SET share_count = share_count + 1 WHERE id = NEW.post_id;
END$$

CREATE TRIGGER trg_repost_del
  AFTER DELETE ON reposts FOR EACH ROW
BEGIN
  UPDATE posts SET share_count = GREATEST(share_count - 1, 0) WHERE id = OLD.post_id;
END$$
DELIMITER ;

-- ───────────────────────────────────────────────────────────
-- Area 5 — Media files
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_files (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id      BIGINT UNSIGNED NOT NULL,
  kind          ENUM('image','audio','video','voice') NOT NULL,
  use_case      ENUM('avatar','comment','post','story','message','other')
                 NOT NULL DEFAULT 'other',
  mime          VARCHAR(80)  NOT NULL,
  url           VARCHAR(512) NOT NULL,
  thumbnail_url VARCHAR(512) DEFAULT NULL,
  bytes         BIGINT UNSIGNED NOT NULL,
  width         INT UNSIGNED DEFAULT NULL,
  height        INT UNSIGNED DEFAULT NULL,
  duration_ms   INT UNSIGNED DEFAULT NULL,
  is_deleted    TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_media_owner (owner_id, created_at DESC),
  INDEX idx_media_kind  (kind)
) ENGINE=InnoDB;

-- ───────────────────────────────────────────────────────────
-- Area 8 — Enhanced comments
-- ───────────────────────────────────────────────────────────
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS attachments JSON DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mentions    JSON DEFAULT NULL,  -- [{ id, username }]
  ADD COLUMN IF NOT EXISTS hashtags    JSON DEFAULT NULL;  -- ["goal","premier-league"]

CREATE TABLE IF NOT EXISTS comment_reactions (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  comment_id  BIGINT UNSIGNED NOT NULL,
  emoji       VARCHAR(16)     NOT NULL,    -- single emoji codepoint sequence
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reaction (user_id, comment_id),  -- one reaction per user per comment
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_reactions_comment (comment_id)
) ENGINE=InnoDB;

-- ───────────────────────────────────────────────────────────
-- Area 9 — Saved posts (persistent across devices)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_posts (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  post_id    BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_saved (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_saved_user (user_id, created_at DESC)
) ENGINE=InnoDB;

-- ───────────────────────────────────────────────────────────
-- Area 2 — Search history + trending
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_history (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  term       VARCHAR(120) NOT NULL,
  result_type VARCHAR(20) DEFAULT NULL,    -- 'user','team','post','hashtag', etc.
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_history_user (user_id, created_at DESC)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS search_terms (
  term        VARCHAR(120) NOT NULL PRIMARY KEY,
  count_24h   INT UNSIGNED NOT NULL DEFAULT 0,
  count_total INT UNSIGNED NOT NULL DEFAULT 0,
  last_seen   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_terms_count24 (count_24h DESC)
) ENGINE=InnoDB;

-- Optional: hashtag denormalisation for fast hashtag search
CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id  BIGINT UNSIGNED NOT NULL,
  tag      VARCHAR(80) NOT NULL,
  PRIMARY KEY (post_id, tag),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_post_hashtags_tag (tag)
) ENGINE=InnoDB;

-- ───────────────────────────────────────────────────────────
-- Area 2 — FULLTEXT indexes for search
-- (MySQL 8.0 InnoDB supports FULLTEXT natively)
-- ───────────────────────────────────────────────────────────
-- Wrap with conditional creation since CREATE FULLTEXT INDEX has no IF NOT EXISTS
SET @has_ft := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'ft_users_search'
);
SET @sql := IF(@has_ft = 0,
  'ALTER TABLE users ADD FULLTEXT INDEX ft_users_search (display_name, username, bio)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_ft := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teams' AND INDEX_NAME = 'ft_teams_search'
);
SET @sql := IF(@has_ft = 0,
  'ALTER TABLE teams ADD FULLTEXT INDEX ft_teams_search (name, short_code, league, country)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_ft := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'players' AND INDEX_NAME = 'ft_players_search'
);
SET @sql := IF(@has_ft = 0,
  'ALTER TABLE players ADD FULLTEXT INDEX ft_players_search (full_name, nationality)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_ft := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND INDEX_NAME = 'ft_posts_search'
);
SET @sql := IF(@has_ft = 0,
  'ALTER TABLE posts ADD FULLTEXT INDEX ft_posts_search (caption)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ───────────────────────────────────────────────────────────
-- Area 11 — Reels vs Video discrimination
-- (Store media metadata on posts so client can pick the right renderer)
-- ───────────────────────────────────────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS media_format ENUM('none','image','video','reel','audio')
                                        NOT NULL DEFAULT 'none' AFTER type,
  ADD COLUMN IF NOT EXISTS media_url      VARCHAR(512) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_thumb    VARCHAR(512) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_width    INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_height   INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_duration_ms INT UNSIGNED DEFAULT NULL,
  ADD INDEX IF NOT EXISTS idx_posts_media_format (media_format);

-- ───────────────────────────────────────────────────────────
-- Area 1 — Notification deduplication helper
-- (avoid spamming the same user with 50 "X liked your post" rows)
-- ───────────────────────────────────────────────────────────
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS dedupe_key VARCHAR(80) DEFAULT NULL,
  ADD INDEX IF NOT EXISTS idx_notif_dedupe (recipient_id, dedupe_key, created_at);

-- ============================================================
-- End of schema deltas
-- ============================================================
