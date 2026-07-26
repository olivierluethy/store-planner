<?php

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\MeController;
use App\Controllers\ProductController;
use App\Controllers\ZoneController;
use App\Router;

/**
 * Route table. Receives the Router instance and registers every endpoint.
 * More specific paths (e.g. /reorder, /{id}/placement) are declared before the
 * generic /{id} routes so they win the match.
 *
 * @param Router $router
 */
return static function (Router $router): void {
    $auth = new AuthController();
    $me = new MeController();
    $zones = new ZoneController();
    $products = new ProductController();

    // --- Public ---
    $router->get('/api/zones', fn () => $zones->index());
    $router->get('/api/products', fn () => $products->index());
    $router->post('/api/auth/register', fn () => $auth->register());
    $router->post('/api/auth/login', fn () => $auth->login());

    // --- Auth / profile ---
    $router->get('/api/auth/me', fn () => $auth->me());
    $router->post('/api/auth/logout', fn () => $auth->logout());
    $router->patch('/api/me/password', fn () => $me->updatePassword());
    $router->patch('/api/me', fn () => $me->updateProfile());

    // --- Products (order matters: specific before /{id}) ---
    $router->post('/api/products', fn () => $products->store());
    $router->patch('/api/products/reorder', fn () => $products->reorder());
    $router->patch('/api/products/{id}/placement', fn (array $a) => $products->placement($a));
    $router->patch('/api/products/{id}', fn (array $a) => $products->update($a));
    $router->delete('/api/products/{id}', fn (array $a) => $products->destroy($a));
};
