-- ============================================================
-- Social 442 — Migration 003: Saved (bookmarked) club-feed items
-- Engine: MySQL 8.0+
-- Run: mysql -u root -proot social442 < migrations/003_saved_posts.sql
-- ============================================================
--
-- WHY THIS EXISTS
-- "Saved" / bookmarked posts were previously kept only in the browser's
-- localStorage (see src/lib/feed/userPrefs.js), so they never synced across
-- devices and the profile "Saved" tab rendered hard-coded mock data. The club
-- feed is aggregated from an upstream API and proxied through clubFeed.js — its
-- items are NOT rows in our own `posts` table and the upstream gives no write
-- contract. So, exactly like club_post_likes (migration 002), we persist saves
-- in an app-owned table keyed by the feed item's stable id (its dedupeId).
--
-- A small JSON `snapshot` of the item is stored alongside so the Saved view can
-- render each entry (title / image / source / link) without re-fetching the
-- cursor-only upstream feed by id.
-- ============================================================

USE social442;

CREATE TABLE IF NOT EXISTS club_post_saves (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  item_id    VARCHAR(190)    NOT NULL,           -- stable feed item id (dedupeId)
  snapshot   JSON            DEFAULT NULL,        -- lightweight render data {kind,title,image,source,link,timestamp}
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_club_save (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_club_save_user (user_id, created_at)
) ENGINE=InnoDB;
