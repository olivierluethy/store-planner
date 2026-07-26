<?php

declare(strict_types=1);

/**
 * Bootstrap: error handling, PSR-4-ish autoloader for the `App\` namespace,
 * config loading and CORS. Required once by public/index.php.
 */

use App\Config;
use App\Http;

// --- Autoloader: App\Foo\Bar -> src/Foo/Bar.php -----------------------------
spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $file = __DIR__ . '/' . $relative . '.php';
    if (is_file($file)) {
        require $file;
    }
});

// --- Config -----------------------------------------------------------------
$configFile = dirname(__DIR__) . '/config.php';
if (!is_file($configFile)) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode([
        'error' => [
            'code' => 'server_error',
            'message' => 'Missing backend/config.php. Copy config.example.php to config.php.',
        ],
    ]);
    exit;
}
Config::load(require $configFile);

// --- Turn PHP errors into JSON envelopes instead of HTML --------------------
error_reporting(E_ALL);
ini_set('display_errors', '0');

set_exception_handler(static function (Throwable $e): void {
    Http::error('server_error', 'Internal server error.', 500);
});

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// --- CORS + preflight -------------------------------------------------------
Http::applyCors();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
