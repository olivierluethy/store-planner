<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database;
use App\Http;

final class ZoneController
{
    /** GET /api/zones — public. All zones on the shared floor, ordered. */
    public function index(): void
    {
        $rows = Database::connection()
            ->query('SELECT id, name, type, x, y, w, h, sort_order FROM zones ORDER BY sort_order, id')
            ->fetchAll();

        $zones = array_map(static fn (array $r): array => [
            'id'         => (int) $r['id'],
            'name'       => $r['name'],
            'type'       => $r['type'],
            'x'          => (int) $r['x'],
            'y'          => (int) $r['y'],
            'w'          => (int) $r['w'],
            'h'          => (int) $r['h'],
            'sort_order' => (int) $r['sort_order'],
        ], $rows);

        Http::json(['zones' => $zones]);
    }
}
