<?php

declare(strict_types=1);

namespace App;

/**
 * Small accumulating validator. Collect field errors then `finish()` — if any
 * were recorded it emits a 422 validation_error envelope with per-field detail.
 */
final class Validator
{
    /** @var array<string,array<string,mixed>> */
    private array $data;
    /** @var array<string,string> */
    private array $errors = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function value(string $key): mixed
    {
        return $this->data[$key] ?? null;
    }

    public function fail(string $field, string $message): void
    {
        $this->errors[$field] ??= $message;
    }

    public function requireString(string $key, int $min = 1, int $max = 255, ?string $label = null): ?string
    {
        $label ??= $key;
        $val = $this->data[$key] ?? null;
        if (!is_string($val) || trim($val) === '') {
            $this->fail($key, "$label is required.");
            return null;
        }
        $val = trim($val);
        $len = mb_strlen($val);
        if ($len < $min) {
            $this->fail($key, "$label must be at least $min characters.");
        } elseif ($len > $max) {
            $this->fail($key, "$label must be at most $max characters.");
        }
        return $val;
    }

    public function optionalString(string $key, int $max = 255, ?string $label = null): ?string
    {
        $label ??= $key;
        $val = $this->data[$key] ?? null;
        if ($val === null || $val === '') {
            return null;
        }
        if (!is_string($val)) {
            $this->fail($key, "$label must be text.");
            return null;
        }
        $val = trim($val);
        if (mb_strlen($val) > $max) {
            $this->fail($key, "$label must be at most $max characters.");
        }
        return $val === '' ? null : $val;
    }

    public function email(string $key): ?string
    {
        $val = $this->requireString($key, 3, 254, 'Email');
        if ($val === null) {
            return null;
        }
        if (!filter_var($val, FILTER_VALIDATE_EMAIL)) {
            $this->fail($key, 'Enter a valid email address.');
        }
        return mb_strtolower($val);
    }

    public function password(string $key, int $min = 8): ?string
    {
        $val = $this->data[$key] ?? null;
        if (!is_string($val) || $val === '') {
            $this->fail($key, 'Password is required.');
            return null;
        }
        if (mb_strlen($val) < $min) {
            $this->fail($key, "Password must be at least $min characters.");
        }
        if (mb_strlen($val) > 200) {
            $this->fail($key, 'Password is too long.');
        }
        return $val;
    }

    /** Optional external image URL; must be http/https when present. */
    public function optionalUrl(string $key, int $max = 2048, ?string $label = null): ?string
    {
        $label ??= $key;
        $val = $this->data[$key] ?? null;
        if ($val === null || $val === '') {
            return null;
        }
        if (!is_string($val)) {
            $this->fail($key, "$label must be a URL string.");
            return null;
        }
        $val = trim($val);
        if (mb_strlen($val) > $max) {
            $this->fail($key, "$label is too long.");
            return null;
        }
        $scheme = strtolower((string) parse_url($val, PHP_URL_SCHEME));
        if (!in_array($scheme, ['http', 'https'], true) || !filter_var($val, FILTER_VALIDATE_URL)) {
            $this->fail($key, 'Image URL must start with http:// or https://.');
        }
        return $val;
    }

    /** A coordinate in [0,1], nullable. Presence controlled by $key existence. */
    public function coordinate(string $key): ?float
    {
        if (!array_key_exists($key, $this->data)) {
            return null;
        }
        $val = $this->data[$key];
        if ($val === null) {
            return null;
        }
        if (!is_int($val) && !is_float($val)) {
            $this->fail($key, "$key must be a number between 0 and 1.");
            return null;
        }
        $f = (float) $val;
        if ($f < 0.0 || $f > 1.0) {
            $this->fail($key, "$key must be between 0 and 1.");
        }
        return $f;
    }

    public function hasErrors(): bool
    {
        return $this->errors !== [];
    }

    /** Emit a 422 with field details if anything failed; otherwise return. */
    public function finish(): void
    {
        if ($this->errors !== []) {
            Http::error('validation_error', 'Some fields are invalid.', 422, $this->errors);
        }
    }
}
