<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** Barraquinha bloqueada pelo admin perde o acesso na próxima requisição, mesmo com sessão aberta. */
class GarantirAcessoAtivo
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->podeEntrar()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors(['usuario' => __('Acesso bloqueado. Procure a coordenação da feira.')]);
        }

        return $next($request);
    }
}
