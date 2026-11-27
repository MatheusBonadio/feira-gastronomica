<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Registra no log as respostas de requisições Inertia que o front não consegue tratar como página:
 * status de erro, resposta sem o header X-Inertia (abre o diálogo de erro do Inertia) e redirect
 * 302 em PUT/PATCH/DELETE (o navegador repete o mesmo método no destino).
 */
class RegistrarRespostasInertia
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $request->header('X-Inertia')) {
            return $response;
        }

        $status = $response->getStatusCode();
        $redirect = in_array($status, [301, 302, 303, 307, 308], true);
        $semInertia = ! $response->headers->has('X-Inertia') && ! $redirect && $status !== 409;
        $redirect302Repetido = $status === 302 && in_array($request->method(), ['PUT', 'PATCH', 'DELETE'], true);

        if ($status >= 400 || $semInertia || $redirect302Repetido) {
            Log::warning('Resposta Inertia problemática', [
                'metodo' => $request->method(),
                'url' => $request->fullUrl(),
                'status' => $status,
                'sem_header_inertia' => $semInertia,
                'redirect_302_em_metodo_nao_get' => $redirect302Repetido,
                'destino' => $redirect ? $response->headers->get('Location') : null,
                'usuario' => $request->user()?->id,
            ]);
        }

        return $response;
    }
}
