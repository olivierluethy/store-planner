<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Database;
use App\Http;
use App\Validator;
use PDO;

final class ProductController
{
    private const SELECT =
        'SELECT p.id, p.name, p.description, p.image_url, p.zone_id, p.pos_x, p.pos_y,
                p.sort_order, p.created_by, p.created_at, p.updated_at, u.display_name AS created_by_name
         FROM products p
         LEFT JOIN users u ON u.id = p.created_by';

    /** GET /api/products — public. ?sort=name|created|updated|zone&order=asc|desc&search= */
    public function index(): void
    {
        $sortMap = [
            'name'    => 'p.name',
            'created' => 'p.created_at',
            'updated' => 'p.updated_at',
            'zone'    => 'p.zone_id',
        ];
        $sort = $sortMap[$_GET['sort'] ?? ''] ?? 'p.sort_order';
        $order = strtolower($_GET['order'] ?? 'asc') === 'desc' ? 'DESC' : 'ASC';
        $search = trim((string) ($_GET['search'] ?? ''));

        $sql = self::SELECT;
        $params = [];
        if ($search !== '') {
            $sql .= ' WHERE p.name LIKE :q OR p.description LIKE :q';
            $params[':q'] = '%' . $search . '%';
        }
        $sql .= " ORDER BY $sort $order, p.id ASC";

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
        $products = array_map([$this, 'serialize'], $stmt->fetchAll());

        Http::json(['products' => $products]);
    }

    /** POST /api/products — authenticated. */
    public function store(): void
    {
        $user = Auth::requireUser();
        $body = Http::body();
        $v = new Validator($body);
        $name = $v->requireString('name', 1, 120, 'Name');
        $description = $v->optionalString('description', 2000, 'Description');
        $imageUrl = $v->optionalUrl('image_url', 2048, 'Image URL');
        $v->finish();

        $pdo = Database::connection();

        // Optional initial placement into a zone (centred).
        $zoneId = null;
        $posX = null;
        $posY = null;
        if (array_key_exists('zone_id', $body) && $body['zone_id'] !== null && $body['zone_id'] !== '') {
            $zoneId = $this->requireZone($body['zone_id']);
            $posX = 0.5;
            $posY = 0.5;
        }

        $nextSort = (int) $pdo->query('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM products')->fetchColumn();

        $stmt = $pdo->prepare(
            'INSERT INTO products (name, description, image_url, zone_id, pos_x, pos_y, sort_order, created_by, created_at, updated_at)
             VALUES (:name, :desc, :img, :zone, :px, :py, :sort, :by, NOW(), NOW())'
        );
        $stmt->bindValue(':name', $name);
        $stmt->bindValue(':desc', $description);
        $stmt->bindValue(':img', $imageUrl);
        $stmt->bindValue(':zone', $zoneId, $zoneId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindValue(':px', $posX);
        $stmt->bindValue(':py', $posY);
        $stmt->bindValue(':sort', $nextSort, PDO::PARAM_INT);
        $stmt->bindValue(':by', $user['id'], PDO::PARAM_INT);
        $stmt->execute();

        Http::json(['product' => $this->find((int) $pdo->lastInsertId())], 201);
    }

    /** PATCH /api/products/{id} — authenticated. Edits name/description/image. */
    public function update(array $args): void
    {
        Auth::requireUser();
        $id = (int) $args['id'];
        $existing = $this->find($id);
        if ($existing === null) {
            Http::error('not_found', 'Product not found.', 404);
        }

        $body = Http::body();
        $v = new Validator($body);
        $fields = [];
        $params = [':id' => $id];

        if (array_key_exists('name', $body)) {
            $name = $v->requireString('name', 1, 120, 'Name');
            $fields[] = 'name = :name';
            $params[':name'] = $name;
        }
        if (array_key_exists('description', $body)) {
            $description = $v->optionalString('description', 2000, 'Description');
            $fields[] = 'description = :desc';
            $params[':desc'] = $description;
        }
        if (array_key_exists('image_url', $body)) {
            $imageUrl = $v->optionalUrl('image_url', 2048, 'Image URL');
            $fields[] = 'image_url = :img';
            $params[':img'] = $imageUrl;
        }
        $v->finish();

        if ($fields === []) {
            Http::json(['product' => $existing]);
        }

        $sql = 'UPDATE products SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id';
        Database::connection()->prepare($sql)->execute($params);

        Http::json(['product' => $this->find($id)]);
    }

    /** DELETE /api/products/{id} — authenticated. */
    public function destroy(array $args): void
    {
        Auth::requireUser();
        $id = (int) $args['id'];
        $stmt = Database::connection()->prepare('DELETE FROM products WHERE id = :id');
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) {
            Http::error('not_found', 'Product not found.', 404);
        }
        Http::json(['ok' => true]);
    }

    /**
     * PATCH /api/products/{id}/placement — authenticated.
     * Body: { zone_id: number|null, pos_x: number|null, pos_y: number|null }.
     */
    public function placement(array $args): void
    {
        Auth::requireUser();
        $id = (int) $args['id'];
        if ($this->find($id) === null) {
            Http::error('not_found', 'Product not found.', 404);
        }

        $body = Http::body();
        $v = new Validator($body);

        $zoneRaw = $body['zone_id'] ?? null;
        $zoneId = null;
        $posX = null;
        $posY = null;

        if ($zoneRaw !== null && $zoneRaw !== '') {
            $zoneId = $this->requireZone($zoneRaw);
            $posX = $v->coordinate('pos_x');
            $posY = $v->coordinate('pos_y');
            $v->finish();
            if ($posX === null || $posY === null) {
                Http::error('validation_error', 'pos_x and pos_y are required when placing into a zone.', 422, [
                    'pos_x' => 'Required.',
                    'pos_y' => 'Required.',
                ]);
            }
            // Clamp inside the zone box so tiles never sit on the very edge.
            $posX = max(0.02, min(0.98, $posX));
            $posY = max(0.02, min(0.98, $posY));
        }

        $stmt = Database::connection()->prepare(
            'UPDATE products SET zone_id = :zone, pos_x = :px, pos_y = :py, updated_at = NOW() WHERE id = :id'
        );
        $stmt->bindValue(':zone', $zoneId, $zoneId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindValue(':px', $posX);
        $stmt->bindValue(':py', $posY);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        Http::json(['product' => $this->find($id)]);
    }

    /** PATCH /api/products/reorder — authenticated. Body: [{id, sort_order}, ...]. */
    public function reorder(): void
    {
        Auth::requireUser();
        $body = Http::body();
        $items = $body['items'] ?? $body;
        if (!is_array($items) || $items === []) {
            Http::error('validation_error', 'Expected a non-empty array of { id, sort_order }.', 422);
        }

        $pdo = Database::connection();
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('UPDATE products SET sort_order = :sort, updated_at = NOW() WHERE id = :id');
        foreach ($items as $item) {
            if (!is_array($item) || !isset($item['id'], $item['sort_order'])) {
                $pdo->rollBack();
                Http::error('validation_error', 'Each item needs an id and a sort_order.', 422);
            }
            $stmt->execute([':sort' => (int) $item['sort_order'], ':id' => (int) $item['id']]);
        }
        $pdo->commit();

        Http::json(['ok' => true]);
    }

    // --- helpers ------------------------------------------------------------

    /** Validate that a zone id exists; emit 422 otherwise. Returns the int id. */
    private function requireZone(mixed $raw): int
    {
        $zoneId = (int) $raw;
        $stmt = Database::connection()->prepare('SELECT id FROM zones WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $zoneId]);
        if ($stmt->fetch() === false) {
            Http::error('validation_error', 'Zone does not exist.', 422, ['zone_id' => 'Unknown zone.']);
        }
        return $zoneId;
    }

    private function find(int $id): ?array
    {
        $stmt = Database::connection()->prepare(self::SELECT . ' WHERE p.id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $this->serialize($row);
    }

    private function serialize(array $r): array
    {
        return [
            'id'             => (int) $r['id'],
            'name'           => $r['name'],
            'description'    => $r['description'],
            'image_url'      => $r['image_url'],
            'zone_id'        => $r['zone_id'] === null ? null : (int) $r['zone_id'],
            'pos_x'          => $r['pos_x'] === null ? null : (float) $r['pos_x'],
            'pos_y'          => $r['pos_y'] === null ? null : (float) $r['pos_y'],
            'sort_order'     => (int) $r['sort_order'],
            'created_by'     => $r['created_by'] === null ? null : (int) $r['created_by'],
            'created_by_name' => $r['created_by_name'] ?? null,
            'created_at'     => $r['created_at'],
            'updated_at'     => $r['updated_at'],
        ];
    }
}
