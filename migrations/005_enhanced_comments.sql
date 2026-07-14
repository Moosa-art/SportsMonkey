-- ============================================================
-- Social 442 — Migration 005: Enhanced comments (Area 8)
-- Engine: MySQL 8.0+ AND MariaDB 10.4+ (portable)
-- Run:  npm run migrate     (preferred — uses .env, no password prompt)
--   or: mysql -u root -p social442 < migrations/005_enhanced_comments.sql
-- ============================================================
--
-- WHY THIS EXISTS
-- The visible comment thread (CommentsSheet) is attached to CLUB-FEED items,
-- which are aggregated upstream and are NOT rows in our own posts table (see
-- migrations/002_club_engagement.sql). Comments for those items live in
-- club_post_comments, keyed by the upstream item id. Area 8 upgrades that
-- table with threading + rich attachments + @mentions + #hashtags, and adds a
-- one-reaction-per-user reactions table.
--
-- PORTABILITY NOTE
-- MySQL 8 does NOT support "ALTER TABLE ... ADD COLUMN IF NOT EXISTS" (that is
-- a MariaDB-only extension). To stay idempotent on BOTH engines we check
-- information_schema first and only run the ALTER when the column/constraint
-- /index is missing. Safe to re-run any number of times.
-- ============================================================

-- Helper pattern (repeated inline because MySQL has no procedural top level):
--   1. count the object in information_schema
--   2. build the DDL string only if it is missing
--   3. PREPARE / EXECUTE / DEALLOCATE

-- ---- club_post_comments.parent_id -------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_post_comments' AND COLUMN_NAME = 'parent_id');
SET @s := IF(@c = 0, 'ALTER TABLE club_post_comments ADD COLUMN parent_id BIGINT UNSIGNED DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- club_post_comments.attachments -----------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_post_comments' AND COLUMN_NAME = 'attachments');
SET @s := IF(@c = 0, 'ALTER TABLE club_post_comments ADD COLUMN attachments JSON DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- club_post_comments.mentions --------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_post_comments' AND COLUMN_NAME = 'mentions');
SET @s := IF(@c = 0, 'ALTER TABLE club_post_comments ADD COLUMN mentions JSON DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- club_post_comments.hashtags --------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_post_comments' AND COLUMN_NAME = 'hashtags');
SET @s := IF(@c = 0, 'ALTER TABLE club_post_comments ADD COLUMN hashtags JSON DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- self-referential FK for replies ----------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'club_post_comments' AND CONSTRAINT_NAME = 'fk_club_comment_parent');
SET @s := IF(@c = 0, 'ALTER TABLE club_post_comments ADD CONSTRAINT fk_club_comment_parent FOREIGN KEY (parent_id) REFERENCES club_post_comments(id) ON DELETE CASCADE', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- index for fetching a comment's replies ---------------------
SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_post_comments' AND INDEX_NAME = 'idx_club_comments_parent');
SET @s := IF(@c = 0, 'ALTER TABLE club_post_comments ADD INDEX idx_club_comments_parent (parent_id)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- reactions on a club-feed comment (one per user per comment) -
CREATE TABLE IF NOT EXISTS club_comment_reactions (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  comment_id  BIGINT UNSIGNED NOT NULL,
  emoji       VARCHAR(16)     NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_club_reaction (user_id, comment_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)              ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES club_post_comments(id) ON DELETE CASCADE,
  INDEX idx_club_reactions_comment (comment_id)
) ENGINE=InnoDB;

-- ============================================================
-- Schema parity for the canonical first-party comments table
-- (unused by the club feed today, but keeps the DB aligned with the audit).
-- ============================================================

-- ---- comments.attachments ---------------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'comments' AND COLUMN_NAME = 'attachments');
SET @s := IF(@c = 0, 'ALTER TABLE comments ADD COLUMN attachments JSON DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- comments.mentions ------------------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'comments' AND COLUMN_NAME = 'mentions');
SET @s := IF(@c = 0, 'ALTER TABLE comments ADD COLUMN mentions JSON DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ---- comments.hashtags ------------------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'comments' AND COLUMN_NAME = 'hashtags');
SET @s := IF(@c = 0, 'ALTER TABLE comments ADD COLUMN hashtags JSON DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

CREATE TABLE IF NOT EXISTS comment_reactions (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  comment_id  BIGINT UNSIGNED NOT NULL,
  emoji       VARCHAR(16)     NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reaction (user_id, comment_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_reactions_comment (comment_id)
) ENGINE=InnoDB;
