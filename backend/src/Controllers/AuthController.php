<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Database;
use App\Http;
use App\Validator;

final class AuthController
{
    /** POST /api/auth/register — public self-registration. */
    public function register(): void
    {
        $body = Http::body();
        $v = new Validator($body);
        $email = $v->email('email');
        $displayName = $v->requireString('display_name', 2, 60, 'Display name');
        $password = $v->password('password', 8);
        $v->finish();

        $pdo = Database::connection();
        $exists = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $exists->execute([':email' => $email]);
        if ($exists->fetch() !== false) {
            Http::error('email_taken', 'An account with this email already exists.', 409, ['email' => 'Email already in use.']);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO users (email, display_name, password_hash, created_at, updated_at)
             VALUES (:email, :name, :hash, NOW(), NOW())'
        );
        $stmt->execute([
            ':email' => $email,
            ':name'  => $displayName,
            ':hash'  => Auth::hashPassword($password),
        ]);
        $userId = (int) $pdo->lastInsertId();

        $token = Auth::issueToken($userId);
        Http::json([
            'token' => $token,
            'user'  => ['id' => $userId, 'email' => $email, 'display_name' => $displayName],
        ], 201);
    }

    /** POST /api/auth/login — public. */
    public function login(): void
    {
        $body = Http::body();
        $v = new Validator($body);
        $email = $v->email('email');
        $password = $v->password('password', 1); // don't leak the min length on login
        $v->finish();

        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT id, email, display_name, password_hash FROM users WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if ($user === false || !Auth::verifyPassword($password, (string) $user['password_hash'])) {
            Http::error('invalid_credentials', 'Email or password is incorrect.', 401);
        }

        $token = Auth::issueToken((int) $user['id']);
        Http::json([
            'token' => $token,
            'user'  => [
                'id'           => (int) $user['id'],
                'email'        => $user['email'],
                'display_name' => $user['display_name'],
            ],
        ]);
    }

    /** GET /api/auth/me — authenticated. */
    public function me(): void
    {
        $user = Auth::requireUser();
        Http::json(['user' => $user]);
    }

    /** POST /api/auth/logout — authenticated. */
    public function logout(): void
    {
        Auth::requireUser();
        Auth::revokeCurrent();
        Http::json(['ok' => true]);
    }
}
