-- 007_direct_messages.sql
-- Direct messaging (1:1 DMs).
--
-- conversations              one row per DM thread (pair_key keeps 1:1 unique)
-- conversation_participants  membership + per-user read cursor
-- messages                   individual chat messages
--
-- Safe to re-run: every object uses CREATE TABLE IF NOT EXISTS and the
-- migrate runner records the file in schema_migrations after a clean apply.

CREATE TABLE IF NOT EXISTS conversations (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- For 1:1 DMs this is "<minUserId>:<maxUserId>", which keeps each pair unique.
  pair_key          VARCHAR(64)     DEFAULT NULL UNIQUE,
  created_by        BIGINT UNSIGNED DEFAULT NULL,
  last_message_id   BIGINT UNSIGNED DEFAULT NULL,
  last_message_text VARCHAR(500)    DEFAULT NULL,
  last_message_at   DATETIME        DEFAULT NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_conversations_last (last_message_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id      BIGINT UNSIGNED NOT NULL,
  user_id              BIGINT UNSIGNED NOT NULL,
  last_read_message_id BIGINT UNSIGNED DEFAULT NULL,
  joined_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id, user_id),
  INDEX idx_cp_user (user_id),
  CONSTRAINT fk_cp_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_user         FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_id       BIGINT UNSIGNED NOT NULL,
  body            TEXT            NOT NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_convo (conversation_id, id),
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender       FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE
) ENGINE=InnoDB;
