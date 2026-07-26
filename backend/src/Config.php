<?php

declare(strict_types=1);

namespace App;

/**
 * Static holder for the runtime configuration array (from backend/config.php).
 */
final class Config
{
    /** @var array<string,mixed> */
    private static array $data = [];

    /** @param array<string,mixed> $data */
    public static function load(array $data): void
    {
        self::$data = $data;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return self::$data[$key] ?? $default;
    }

    /** @return array<string,mixed> */
    public static function db(): array
    {
        return self::$data['db'] ?? [];
    }

    /** @return string[] */
    public static function corsOrigins(): array
    {
        return self::$data['cors_allowed_origins'] ?? [];
    }

    public static function tokenTtlDays(): int
    {
        return (int) (self::$data['token_ttl_days'] ?? 30);
    }
}
