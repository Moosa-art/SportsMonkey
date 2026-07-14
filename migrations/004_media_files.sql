-- ============================================================
-- Social 442 — Migration 004: Media files (upload pipeline)
-- Engine: MySQL 8.0+
-- Run: mysql -u root -proot social442 < migrations/004_media_files.sql
-- ============================================================
--
-- WHY THIS EXISTS
-- Area 5 introduces a real upload pipeline (avatars, comment attachments,
-- post/story media, voice notes). Every uploaded asset is processed
-- server-side (images -> WEBP + thumbnail; audio/video probed for duration
-- and dimensions) and recorded here. The actual bytes live in the configured
-- storage backend (local disk in dev, Cloudflare R2 / S3-compatible in prod —
-- see server/storage/index.js); this table holds the metadata + public URL.
--
-- Other features reference a row by its id (e.g. comments.attachments stores
-- { kind, media_id } and the server resolves the URL at insert time).
-- ============================================================

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
