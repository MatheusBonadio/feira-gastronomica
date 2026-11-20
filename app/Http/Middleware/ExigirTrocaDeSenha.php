<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExigirTrocaDeSenha
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->trocar_senha && ! $request->routeIs('senha.*', 'logout', 'idioma')) {
            return redirect()->route('senha.edit');
        }

        return $next($request);
    }
}
