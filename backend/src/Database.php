<?php

declare(strict_types=1);

namespace App;

use PDO;
use PDOException;

/**
 * Lazy PDO singleton with sane defaults (exceptions, assoc fetch, native types).
 */
final class Database
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $db = Config::db();
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $db['host'] ?? '127.0.0.1',
            (int) ($db['port'] ?? 3306),
            $db['name'] ?? '',
            $db['charset'] ?? 'utf8mb4'
        );

        try {
            self::$pdo = new PDO($dsn, $db['user'] ?? '', $db['pass'] ?? '', [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException) {
            Http::error('server_error', 'Database connection failed.', 500);
        }

        return self::$pdo;
    }
}
