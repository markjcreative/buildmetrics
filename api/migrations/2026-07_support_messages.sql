-- BuildMetrics — support / contact messages
-- Run once in phpMyAdmin (database: u668627379_buildmetrics).
-- Safe to re-run: uses IF NOT EXISTS.
-- Stores every support submission (ticket log) and backs IP rate limiting.

CREATE TABLE IF NOT EXISTS support_messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NULL,
  name        VARCHAR(120) NULL,
  email       VARCHAR(255) NOT NULL,
  category    VARCHAR(40)  NOT NULL DEFAULT 'question',
  subject     VARCHAR(200) NULL,
  message     TEXT NOT NULL,
  page_url    VARCHAR(500) NULL,
  ip          VARCHAR(45)  NULL,
  emailed     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip_time (ip, created_at),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
