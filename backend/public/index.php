<?php

declare(strict_types=1);

/**
 * Front controller. Every request is routed through here (see public/.htaccess).
 */

use App\Http;
use App\Router;

require dirname(__DIR__) . '/src/bootstrap.php';

$router = new Router();
(require dirname(__DIR__) . '/src/routes.php')($router);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

// Health check for quick sanity testing.
if ($path === '/' || $path === '/api' || $path === '/api/health') {
    Http::json(['ok' => true, 'service' => 'store-planner-api']);
}

$router->dispatch($method, $path);
