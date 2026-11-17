<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

/** Idioma: escolha da sessão, senão a preferência salva do usuário, senão o padrão da aplicação. */
class DefinirIdioma
{
    public function handle(Request $request, Closure $next): Response
    {
        $disponiveis = array_keys(config('feira.idiomas'));
        $idioma = $request->session()->get('idioma') ?? $request->user()?->idioma;

        if (in_array($idioma, $disponiveis, true)) {
            app()->setLocale($idioma);
        }

        Carbon::setLocale(app()->getLocale());

        $response = $next($request);
        $response->headers->set('Content-Language', str_replace('_', '-', app()->getLocale()));

        return $response;
    }
}
