<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Uso: ->middleware('perfil:admin') ou 'perfil:barraquinha'. Checado no servidor, não só escondido na tela. */
class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$perfis): Response
    {
        abort_unless(in_array($request->user()?->perfil->value, $perfis, true), 403);

        return $next($request);
    }
}
