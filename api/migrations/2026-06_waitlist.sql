-- BuildMetrics — pre-launch waitlist
-- Run once in phpMyAdmin (database: u668627379_buildmetrics).
-- Safe to re-run: uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS waitlist (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  company     VARCHAR(160) NULL,
  role        VARCHAR(80)  NULL,
  ip          VARCHAR(45)  NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip_time (ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
