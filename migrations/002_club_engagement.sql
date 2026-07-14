-- ============================================================
-- Social 442 — Migration 002: Club-feed engagement
-- Engine: MySQL 8.0+
-- Run: mysql -u root -p social442 < migrations/002_club_engagement.sql
-- ============================================================
--
-- WHY THIS EXISTS
-- The club feed is aggregated from an upstream `club-feed-new` API and proxied
-- through server/routes/clubFeed.js. Those items are NOT rows in our own
-- `posts` table, and the upstream provides no write contract for likes. As a
-- result likes were never persisted (the old /club-social routes were no-ops),
-- so a like vanished on refresh and no counts were ever shown.
--
-- This migration adds an app-owned engagement store keyed by the feed item's
-- stable string id (news article id / video id). It lets us persist likes,
-- count comments & shares, and read back the viewer's liked state on reload.
-- ============================================================

USE social442;

-- ── Who liked which club-feed item ───────────────────────────
CREATE TABLE IF NOT EXISTS club_post_likes (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  item_id    VARCHAR(190)    NOT NULL,           -- upstream feed item id (string)
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_club_like (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_club_like_item (item_id)
) ENGINE=InnoDB;

-- ── Denormalised counters per club-feed item ─────────────────
-- like_count is kept in sync from club_post_likes; comment_count / share_count
-- are incremented by their respective endpoints.
CREATE TABLE IF NOT EXISTS club_post_stats (
  item_id       VARCHAR(190) PRIMARY KEY,
  like_count    INT UNSIGNED NOT NULL DEFAULT 0,
  comment_count INT UNSIGNED NOT NULL DEFAULT 0,
  share_count   INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Comments left on a club-feed item ────────────────────────
CREATE TABLE IF NOT EXISTS club_post_comments (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id    VARCHAR(190)    NOT NULL,
  author_id  BIGINT UNSIGNED NOT NULL,
  body       TEXT            NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME        DEFAULT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_club_comments_item (item_id, created_at)
) ENGINE=InnoDB;
