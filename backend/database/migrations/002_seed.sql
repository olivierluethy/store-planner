-- Store Planner — seed data (002_seed)
-- Run after 001_init.sql. Seeds the fixed floor (5 shelves + 3 windows),
-- a demo user and 6 demo products (3 placed, 3 unplaced).
--   mysql -u USER -p storeplanner < 002_seed.sql

SET NAMES utf8mb4;

-- --------------------------------------------------------------------------
-- Zones — non-overlapping rectangles inside the 1000x700 logical canvas.
-- Windows form the shopfront along the top edge; shelves fill the interior.
-- --------------------------------------------------------------------------
INSERT INTO `zones` (`id`, `name`, `type`, `x`, `y`, `w`, `h`, `sort_order`) VALUES
    (1, 'Fenster 1', 'window',  40,  20, 280,  90, 1),
    (2, 'Fenster 2', 'window', 360,  20, 280,  90, 2),
    (3, 'Fenster 3', 'window', 680,  20, 280,  90, 3),
    (4, 'Regal 1',   'shelf',   40, 160, 270, 200, 4),
    (5, 'Regal 2',   'shelf',  365, 160, 270, 200, 5),
    (6, 'Regal 3',   'shelf',  690, 160, 270, 200, 6),
    (7, 'Regal 4',   'shelf',  120, 410, 340, 210, 7),
    (8, 'Regal 5',   'shelf',  540, 410, 340, 210, 8);

-- --------------------------------------------------------------------------
-- Demo user — login: demo@store.local / demo1234
-- (hash is password_hash('demo1234', PASSWORD_DEFAULT))
-- --------------------------------------------------------------------------
INSERT INTO `users` (`id`, `email`, `display_name`, `password_hash`) VALUES
    (1, 'demo@store.local', 'Demo Ladenchef', '$2y$12$ZgRHxiz8u4bvwK3XxvY0Q.vz1WpjDtdfr8qv/wDMUwyBwVTp4DHqS');

-- --------------------------------------------------------------------------
-- Products — 3 placed into zones, 3 unplaced (tray). Public demo images.
-- --------------------------------------------------------------------------
INSERT INTO `products`
    (`name`, `description`, `image_url`, `zone_id`, `pos_x`, `pos_y`, `sort_order`, `created_by`) VALUES
    ('Bio-Äpfel',        'Knackige regionale Äpfel aus dem Umland.',        'https://picsum.photos/seed/apples/400/400',  4,    0.28000, 0.40000, 1, 1),
    ('Vollkornbrot',     'Frisch gebackenes Roggen-Vollkornbrot.',          'https://picsum.photos/seed/bread/400/400',   4,    0.68000, 0.62000, 2, 1),
    ('Kaffeebohnen',     'Dunkle Röstung, ganze Bohnen, 1kg.',              'https://picsum.photos/seed/coffee/400/400',  6,    0.50000, 0.45000, 3, 1),
    ('Rotwein Reserve',  'Trockener Rotwein, Jahrgang 2021.',               'https://picsum.photos/seed/wine/400/400',    NULL, NULL,    NULL,    4, 1),
    ('Handseife',        'Milde Flüssigseife mit Lavendelduft.',            'https://picsum.photos/seed/soap/400/400',    NULL, NULL,    NULL,    5, 1),
    ('Notizbuch A5',     'Hardcover-Notizbuch, punktiert, 120 Blatt.',      'https://picsum.photos/seed/notebook/400/400', NULL, NULL,   NULL,    6, 1);
