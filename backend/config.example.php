<?php

/**
 * Copy this file to `config.php` and fill in real values.
 * `config.php` is gitignored and read at runtime by the API.
 */

return [
    // --- Database (PDO / MySQL / MariaDB) ---
    'db' => [
        'host'    => '127.0.0.1',
        'port'    => 3306,
        'name'    => 'storeplanner',
        'user'    => 'storeplanner',
        'pass'    => 'change-me',
        'charset' => 'utf8mb4',
    ],

    // --- CORS ---
    // Exact origins allowed to call the API. The Capacitor apps use the
    // 'capacitor://localhost' (iOS) and 'https://localhost' (Android) origins.
    'cors_allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:8100',
        'capacitor://localhost',
        'https://localhost',
    ],

    // Public URL the API is served from (informational, used in docs/links).
    'app_url' => 'http://localhost:8080',

    // Auth token lifetime in days (sliding — refreshed on each authed request).
    'token_ttl_days' => 30,
];
