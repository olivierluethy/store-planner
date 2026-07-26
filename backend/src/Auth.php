<?php

declare(strict_types=1);

namespace App;

use PDO;

/**
 * Token-based authentication. Opaque 64-char random tokens live in `auth_tokens`
 * with a sliding 30-day expiry. Clients send `Authorization: Bearer <token>`.
 */
final class Auth
{
    private static ?array $cachedUser = null;
    private static bool $resolved = false;

    /** Issue a fresh token for a user and return it. */
    public static function issueToken(int $userId): string
    {
        $token = bin2hex(random_bytes(32)); // 64 hex chars
        $ttl = Config::tokenTtlDays();
        $stmt = Database::connection()->prepare(
            'INSERT INTO auth_tokens (user_id, token, expires_at, created_at)
             VALUES (:uid, :token, DATE_ADD(NOW(), INTERVAL :ttl DAY), NOW())'
        );
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':token', $token);
        $stmt->bindValue(':ttl', $ttl, PDO::PARAM_INT);
        $stmt->execute();
        return $token;
    }

    /** Extract the bearer token from the Authorization header. */
    public static function bearerToken(): ?string
    {
        $header = Http::header('Authorization');
        if ($header === null) {
            return null;
        }
        if (preg_match('/^Bearer\s+(.+)$/i', trim($header), $m)) {
            return trim($m[1]);
        }
        return null;
    }

    /**
     * Resolve the current user from the bearer token, or null. Refreshes the
     * token expiry (sliding window) on a successful, non-expired lookup.
     *
     * @return array{id:int,email:string,display_name:string}|null
     */
    public static function currentUser(): ?array
    {
        if (self::$resolved) {
            return self::$cachedUser;
        }
        self::$resolved = true;

        $token = self::bearerToken();
        if ($token === null) {
            return self::$cachedUser = null;
        }

        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            'SELECT t.id AS token_id, t.expires_at, u.id, u.email, u.display_name
             FROM auth_tokens t
             JOIN users u ON u.id = t.user_id
             WHERE t.token = :token
             LIMIT 1'
        );
        $stmt->execute([':token' => $token]);
        $row = $stmt->fetch();
        if ($row === false) {
            return self::$cachedUser = null;
        }

        if (strtotime((string) $row['expires_at']) < time()) {
            // Expired — clean it up and reject.
            $del = $pdo->prepare('DELETE FROM auth_tokens WHERE id = :id');
            $del->execute([':id' => $row['token_id']]);
            return self::$cachedUser = null;
        }

        // Slide the expiry forward.
        $refresh = $pdo->prepare(
            'UPDATE auth_tokens SET expires_at = DATE_ADD(NOW(), INTERVAL :ttl DAY) WHERE id = :id'
        );
        $refresh->bindValue(':ttl', Config::tokenTtlDays(), PDO::PARAM_INT);
        $refresh->bindValue(':id', (int) $row['token_id'], PDO::PARAM_INT);
        $refresh->execute();

        return self::$cachedUser = [
            'id'           => (int) $row['id'],
            'email'        => (string) $row['email'],
            'display_name' => (string) $row['display_name'],
        ];
    }

    /** Require an authenticated user or emit 401 and stop. */
    public static function requireUser(): array
    {
        $user = self::currentUser();
        if ($user === null) {
            Http::error('unauthorized', 'Authentication required.', 401);
        }
        return $user;
    }

    /** Invalidate the presented token (logout). */
    public static function revokeCurrent(): void
    {
        $token = self::bearerToken();
        if ($token === null) {
            return;
        }
        $stmt = Database::connection()->prepare('DELETE FROM auth_tokens WHERE token = :token');
        $stmt->execute([':token' => $token]);
    }

    public static function hashPassword(string $plain): string
    {
        return password_hash($plain, PASSWORD_DEFAULT);
    }

    public static function verifyPassword(string $plain, string $hash): bool
    {
        return password_verify($plain, $hash);
    }
}
