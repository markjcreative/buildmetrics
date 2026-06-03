-- BuildMetrics Database Schema
-- Run once in Hostinger phpMyAdmin

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  salt          VARCHAR(64),
  google_id     VARCHAR(255),
  provider      VARCHAR(20) DEFAULT 'email',
  picture       VARCHAR(500),
  designation   VARCHAR(255) DEFAULT '',
  company       VARCHAR(255) DEFAULT '',
  plan          VARCHAR(20) DEFAULT 'free',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id          VARCHAR(36) PRIMARY KEY,
  user_id     INT NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  colour      VARCHAR(7) DEFAULT '#2563EB',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS calculations (
  id          VARCHAR(36) PRIMARY KEY,
  user_id     INT NOT NULL,
  project_id  VARCHAR(36),
  calc_type   VARCHAR(50) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  inputs      JSON,
  results     JSON,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  type       VARCHAR(30) DEFAULT 'info',
  title      VARCHAR(255) NOT NULL,
  message    TEXT,
  link       VARCHAR(500),
  is_read    TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ── Engineering Canvas Report Builder ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `reports` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'Untitled Report',
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reports_user` (`user_id`),
  KEY `idx_reports_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `report_blocks` (
  `id` varchar(36) NOT NULL,
  `report_id` varchar(36) NOT NULL,
  `type` varchar(64) NOT NULL,
  `order_index` int NOT NULL DEFAULT 0,
  `label` varchar(255) DEFAULT NULL,
  `config_json` longtext DEFAULT NULL,
  `results_json` longtext DEFAULT NULL,
  `validated` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_blocks_report` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `report_templates` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(64) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(10) DEFAULT NULL,
  `blocks_json` longtext NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Report Version History ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `report_versions` (
  `id` varchar(36) NOT NULL,
  `report_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `version_label` varchar(50) NOT NULL DEFAULT 'Auto-save',
  `blocks_snapshot` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rv_report` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Report Activity Log ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `report_activity` (
  `id` varchar(36) NOT NULL,
  `report_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `action` varchar(50) NOT NULL,
  `detail` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ra_report` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Report Share Links ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `report_shares` (
  `id` varchar(36) NOT NULL,
  `report_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `view_count` int NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`token`),
  KEY `idx_rs_report` (`report_id`),
  KEY `idx_rs_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
