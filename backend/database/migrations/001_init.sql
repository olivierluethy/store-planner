-- Store Planner — schema (001_init)
-- Import into an existing database (e.g. `storeplanner`) via phpMyAdmin or:
--   mysql -u USER -p storeplanner < 001_init.sql
-- Engine InnoDB, charset utf8mb4 throughout.

-- Optional: uncomment to create + select the database when importing at server level.
-- CREATE DATABASE IF NOT EXISTS `storeplanner` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `storeplanner`;

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- --------------------------------------------------------------------------
-- users
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email`         VARCHAR(254) NOT NULL,
    `display_name`  VARCHAR(60)  NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- auth_tokens — opaque bearer tokens, sliding 30-day expiry
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auth_tokens` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`    INT UNSIGNED NOT NULL,
    `token`      CHAR(64)     NOT NULL,
    `expires_at` DATETIME     NOT NULL,
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_auth_tokens_token` (`token`),
    KEY `idx_auth_tokens_user` (`user_id`),
    CONSTRAINT `fk_auth_tokens_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- zones — seeded shelves & windows on the 1000x700 logical canvas
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `zones` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(60)  NOT NULL,
    `type`       ENUM('shelf','window') NOT NULL,
    `x`          INT NOT NULL,
    `y`          INT NOT NULL,
    `w`          INT NOT NULL,
    `h`          INT NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_zones_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- products — image referenced by URL, zone-relative normalised position
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(120) NOT NULL,
    `description` TEXT         NULL,
    `image_url`   VARCHAR(2048) NULL,
    `zone_id`     INT UNSIGNED NULL,
    `pos_x`       DECIMAL(6,5) NULL,
    `pos_y`       DECIMAL(6,5) NULL,
    `sort_order`  INT NOT NULL DEFAULT 0,
    `created_by`  INT UNSIGNED NULL,
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_products_zone` (`zone_id`),
    KEY `idx_products_sort` (`sort_order`),
    CONSTRAINT `fk_products_zone` FOREIGN KEY (`zone_id`)
        REFERENCES `zones` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_products_user` FOREIGN KEY (`created_by`)
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
