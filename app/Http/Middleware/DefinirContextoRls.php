<?php

namespace App\Http\Middleware;

use App\Support\ContextoRls;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Grava o perfil e a barraquinha da sessão na conexão do banco (RLS). Roda em toda requisição web. */
class DefinirContextoRls
{
    public function __construct(private readonly ContextoRls $contexto) {}

    public function handle(Request $request, Closure $next): Response
    {
        $this->contexto->definirPara($request->user());

        return $next($request);
    }
}
