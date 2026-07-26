<?php

declare(strict_types=1);

namespace App;

/**
 * Minimal regex router. Patterns use `{name}` placeholders which match a single
 * path segment and are passed to the handler as an associative array.
 */
final class Router
{
    /** @var array<int,array{method:string,regex:string,params:string[],handler:callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $params = [];
        $regex = preg_replace_callback('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', static function ($m) use (&$params) {
            $params[] = $m[1];
            return '([^/]+)';
        }, $pattern);
        $this->routes[] = [
            'method'  => strtoupper($method),
            'regex'   => '#^' . $regex . '$#',
            'params'  => $params,
            'handler' => $handler,
        ];
    }

    public function get(string $p, callable $h): void { $this->add('GET', $p, $h); }
    public function post(string $p, callable $h): void { $this->add('POST', $p, $h); }
    public function patch(string $p, callable $h): void { $this->add('PATCH', $p, $h); }
    public function delete(string $p, callable $h): void { $this->add('DELETE', $p, $h); }

    public function dispatch(string $method, string $path): void
    {
        $method = strtoupper($method);
        $pathMatchedOtherMethod = false;

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }
            if ($route['method'] !== $method) {
                $pathMatchedOtherMethod = true;
                continue;
            }
            array_shift($matches);
            $args = [];
            foreach ($route['params'] as $i => $name) {
                $args[$name] = $matches[$i] ?? null;
            }
            ($route['handler'])($args);
            return;
        }

        if ($pathMatchedOtherMethod) {
            Http::error('method_not_allowed', 'Method not allowed for this resource.', 405);
        }
        Http::error('not_found', 'Resource not found.', 404);
    }
}
