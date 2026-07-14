-- ============================================================
-- Social 442 — Full Schema
-- Engine: MySQL 8.0+
-- Run: mysql -u root -p social442 < 001_create_schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS social442
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE social442;

-- ── Auth ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(30)  NOT NULL UNIQUE,
  display_name  VARCHAR(80)  NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,           -- bcrypt
  avatar_url    VARCHAR(512) DEFAULT NULL,
  bio           TEXT         DEFAULT NULL,
  gender ENUM('male','female','other') DEFAULT NULL,
  
  -- club affiliation
  favourite_club_id  BIGINT UNSIGNED DEFAULT NULL,
  -- role: 'user' | 'player' | 'team_admin'
  role          ENUM('user','player','team_admin') NOT NULL DEFAULT 'user',
  is_verified   TINYINT(1)  NOT NULL DEFAULT 0,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  -- tokens
  refresh_token  VARCHAR(512) DEFAULT NULL,
  reset_token    VARCHAR(128) DEFAULT NULL,
  reset_token_expires DATETIME DEFAULT NULL,
  -- timestamps
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME    DEFAULT NULL,
  INDEX idx_users_email       (email),
  INDEX idx_users_username    (username)
) ENGINE=InnoDB;

-- ── Player Profiles (linked to users) ────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL UNIQUE,
  full_name     VARCHAR(120) NOT NULL,
  position      VARCHAR(40)  DEFAULT NULL,       -- Forward, Midfielder, etc.
  nationality   VARCHAR(60)  DEFAULT NULL,
  date_of_birth DATE         DEFAULT NULL,
  current_club_id BIGINT UNSIGNED DEFAULT NULL,
  shirt_number  TINYINT UNSIGNED DEFAULT NULL,
  photo_url     VARCHAR(512) DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Teams ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  short_code    VARCHAR(5)   NOT NULL,           -- ARS, MCI, LIV
  crest_url     VARCHAR(512) DEFAULT NULL,
  primary_color VARCHAR(10)  DEFAULT '#000000',
  league        VARCHAR(80)  DEFAULT NULL,
  country       VARCHAR(60)  DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

ALTER TABLE users   ADD CONSTRAINT fk_users_club   FOREIGN KEY (favourite_club_id)   REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE players ADD CONSTRAINT fk_players_club FOREIGN KEY (current_club_id)      REFERENCES teams(id) ON DELETE SET NULL;

-- ── Posts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  author_id     BIGINT UNSIGNED NOT NULL,        -- users.id
  type          VARCHAR(40)  NOT NULL,           -- match_score, poll, image, etc.
  -- author display cache (denormalised for fast feed queries)
  username      VARCHAR(30)  NOT NULL,
  subtitle      VARCHAR(120) DEFAULT NULL,
  user_color    VARCHAR(10)  DEFAULT NULL,
  user_initial  CHAR(2)      DEFAULT NULL,
  user_image    VARCHAR(512) DEFAULT NULL,
  is_verified   TINYINT(1)   NOT NULL DEFAULT 0,
  caption       TEXT         DEFAULT NULL,
  -- JSON payload; structure varies by type (matches existing posts.js shape)
  data          JSON         NOT NULL,
  -- counts (denormalised for fast reads; incremented by triggers)
  like_count    INT UNSIGNED NOT NULL DEFAULT 0,
  comment_count INT UNSIGNED NOT NULL DEFAULT 0,
  share_count   INT UNSIGNED NOT NULL DEFAULT 0,
  is_pinned     TINYINT(1)   NOT NULL DEFAULT 0,
  is_hidden     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME     DEFAULT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_posts_author    (author_id),
  INDEX idx_posts_type      (type),
  INDEX idx_posts_created   (created_at DESC),
  INDEX idx_posts_not_del   (deleted_at, created_at DESC)
) ENGINE=InnoDB;

-- ── Likes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  -- polymorphic: post | comment
  target_type ENUM('post','comment') NOT NULL,
  target_id   BIGINT UNSIGNED        NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_like (user_id, target_type, target_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_likes_target (target_type, target_id)
) ENGINE=InnoDB;

-- ── Comments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id      BIGINT UNSIGNED NOT NULL,
  author_id    BIGINT UNSIGNED NOT NULL,
  parent_id    BIGINT UNSIGNED DEFAULT NULL,     -- NULL = top-level; set = reply
  body         TEXT         NOT NULL,
  like_count   INT UNSIGNED NOT NULL DEFAULT 0,
  is_hidden    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME     DEFAULT NULL,
  FOREIGN KEY (post_id)   REFERENCES posts(id)    ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_comments_post   (post_id, created_at ASC),
  INDEX idx_comments_author (author_id)
) ENGINE=InnoDB;

-- ── Follows ───────────────────────────────────────────────────
-- Covers: user→user, user→player, user→team
CREATE TABLE IF NOT EXISTS follows (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  follower_id   BIGINT UNSIGNED NOT NULL,         -- always users.id
  -- polymorphic target
  target_type   ENUM('user','player','team') NOT NULL,
  target_id     BIGINT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_follow (follower_id, target_type, target_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_follows_follower (follower_id),
  INDEX idx_follows_target   (target_type, target_id)
) ENGINE=InnoDB;

-- ── Reports ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id  BIGINT UNSIGNED NOT NULL,
  -- polymorphic
  target_type  ENUM('post','comment','user') NOT NULL,
  target_id    BIGINT UNSIGNED NOT NULL,
  reason       ENUM(
    'spam','hate_speech','misinformation',
    'harassment','violence','nudity','other'
  ) NOT NULL,
  detail       TEXT DEFAULT NULL,
  status       ENUM('pending','reviewed','dismissed','actioned')
               NOT NULL DEFAULT 'pending',
  reviewed_by  BIGINT UNSIGNED DEFAULT NULL,      -- admin user id
  reviewed_at  DATETIME DEFAULT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reports_target  (target_type, target_id),
  INDEX idx_reports_status  (status)
) ENGINE=InnoDB;

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  recipient_id BIGINT UNSIGNED NOT NULL,
  actor_id     BIGINT UNSIGNED DEFAULT NULL,      -- who triggered it
  type         VARCHAR(40) NOT NULL,              -- like_post, new_comment, new_follower, etc.
  -- polymorphic payload reference
  ref_type     VARCHAR(20) DEFAULT NULL,
  ref_id       BIGINT UNSIGNED DEFAULT NULL,
  body         VARCHAR(255) DEFAULT NULL,         -- rendered text fallback
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_recipient (recipient_id, is_read, created_at DESC)
) ENGINE=InnoDB;

-- ── Feed (Fixtures cache) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS fixtures (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  external_id  VARCHAR(80) UNIQUE DEFAULT NULL,
  home_team_id BIGINT UNSIGNED DEFAULT NULL,
  away_team_id BIGINT UNSIGNED DEFAULT NULL,
  home_name    VARCHAR(80)  NOT NULL,
  away_name    VARCHAR(80)  NOT NULL,
  home_score   TINYINT DEFAULT NULL,
  away_score   TINYINT DEFAULT NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'Upcoming', -- Past | Upcoming | Live
  match_date   DATETIME     NOT NULL,
  month_index  TINYINT      NOT NULL,            -- 0–11
  match_year   SMALLINT     NOT NULL,
  league       VARCHAR(80)  DEFAULT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fixtures_date  (match_date),
  INDEX idx_fixtures_month (match_year, month_index)
) ENGINE=InnoDB;

-- ── League Table cache ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS league_table (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  league       VARCHAR(80) NOT NULL,
  team_name    VARCHAR(80) NOT NULL,
  team_id      BIGINT UNSIGNED DEFAULT NULL,
  p            TINYINT UNSIGNED NOT NULL DEFAULT 0,
  w            TINYINT UNSIGNED NOT NULL DEFAULT 0,
  d            TINYINT UNSIGNED NOT NULL DEFAULT 0,
  l            TINYINT UNSIGNED NOT NULL DEFAULT 0,
  gd           SMALLINT        NOT NULL DEFAULT 0,
  pts          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  position     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_table_entry (league, team_name)
) ENGINE=InnoDB;

-- ── Triggers: keep denorm counts in sync ──────────────────────

-- like_count on posts
DELIMITER $$
CREATE TRIGGER trg_like_post_ins
  AFTER INSERT ON likes FOR EACH ROW
BEGIN
  IF NEW.target_type = 'post' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.target_id;
  ELSEIF NEW.target_type = 'comment' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.target_id;
  END IF;
END$$

CREATE TRIGGER trg_like_post_del
  AFTER DELETE ON likes FOR EACH ROW
BEGIN
  IF OLD.target_type = 'post' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
  ELSEIF OLD.target_type = 'comment' THEN
    UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
  END IF;
END$$

-- comment_count on posts
CREATE TRIGGER trg_comment_ins
  AFTER INSERT ON comments FOR EACH ROW
BEGIN
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
END$$

CREATE TRIGGER trg_comment_del
  AFTER DELETE ON comments FOR EACH ROW
BEGIN
  UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
END$$

DELIMITER ;
