<?php

declare(strict_types=1);

namespace App;

/**
 * Request/response helpers: JSON output, the uniform error envelope, request
 * body parsing, header access and CORS.
 */
final class Http
{
    /** Emit a JSON response and stop. */
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    /** Emit the uniform error envelope { error: { code, message } } and stop. */
    public static function error(string $code, string $message, int $status = 400, ?array $fields = null): never
    {
        $error = ['code' => $code, 'message' => $message];
        if ($fields !== null) {
            $error['fields'] = $fields;
        }
        self::json(['error' => $error], $status);
    }

    /** Parse and return the JSON request body as an array (empty on none). */
    public static function body(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            self::error('validation_error', 'Request body must be a JSON object.', 422);
        }
        return $decoded;
    }

    /** Case-insensitive request header lookup. */
    public static function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (isset($_SERVER[$key])) {
            return $_SERVER[$key];
        }
        // Some SAPIs expose Authorization separately.
        if ($name === 'Authorization') {
            if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            }
            if (function_exists('apache_request_headers')) {
                $headers = apache_request_headers();
                foreach ($headers as $hk => $hv) {
                    if (strcasecmp($hk, 'Authorization') === 0) {
                        return $hv;
                    }
                }
            }
        }
        return null;
    }

    /** Reflect an allowed Origin and advertise the CORS contract. */
    public static function applyCors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = Config::corsOrigins();
        if ($origin !== '' && in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        }
        header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        header('Access-Control-Max-Age: 86400');
    }
}
