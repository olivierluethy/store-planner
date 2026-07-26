<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Database;
use App\Http;
use App\Validator;

final class MeController
{
    /** PATCH /api/me — update own display name. */
    public function updateProfile(): void
    {
        $user = Auth::requireUser();
        $v = new Validator(Http::body());
        $displayName = $v->requireString('display_name', 2, 60, 'Display name');
        $v->finish();

        $stmt = Database::connection()->prepare(
            'UPDATE users SET display_name = :name, updated_at = NOW() WHERE id = :id'
        );
        $stmt->execute([':name' => $displayName, ':id' => $user['id']]);

        Http::json([
            'user' => ['id' => $user['id'], 'email' => $user['email'], 'display_name' => $displayName],
        ]);
    }

    /** PATCH /api/me/password — change own password (verifies the current one). */
    public function updatePassword(): void
    {
        $user = Auth::requireUser();
        $body = Http::body();
        $v = new Validator($body);
        $current = $v->password('current_password', 1);
        $next = $v->password('new_password', 8);
        $v->finish();

        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $user['id']]);
        $row = $stmt->fetch();
        if ($row === false || !Auth::verifyPassword($current, (string) $row['password_hash'])) {
            Http::error('invalid_credentials', 'Current password is incorrect.', 401, ['current_password' => 'Incorrect password.']);
        }

        $update = $pdo->prepare('UPDATE users SET password_hash = :hash, updated_at = NOW() WHERE id = :id');
        $update->execute([':hash' => Auth::hashPassword($next), ':id' => $user['id']]);

        Http::json(['ok' => true]);
    }
}
