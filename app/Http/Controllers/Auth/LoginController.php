<?php

namespace App\Http\Controllers\Auth;

use App\Enums\AcaoAuditoria;
use App\Http\Controllers\Controller;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\AuditoriaLog;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class LoginController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('auth/Login');
    }

    public function store(Request $request, AuthService $auth): HttpResponse
    {
        $dados = $request->validate([
            'usuario' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string', 'max:200'],
        ], attributes: ['usuario' => __('usuário'), 'password' => __('senha')]);

        $user = $auth->autenticar($dados['usuario'], $dados['password'], $request->ip());

        Auth::login($user);
        $request->session()->regenerate();

        $destino = redirect()->intended(route($user->perfil->homeRoute()))->getTargetUrl();

        if ($user->idioma) {
            $request->session()->put('idioma', $user->idioma);

            // Idioma diferente do da tela de login: recarga completa (o dicionário vem uma vez por carga).
            if ($user->idioma !== app()->getLocale()) {
                return Inertia::location($destino);
            }
        }

        // Sem recarga (mais rápido, e com a transição do login): as rotas do perfil
        // chegam junto com a primeira página (prop "rotas", ver HandleInertiaRequests).
        $request->session()->put(HandleInertiaRequests::ENVIAR_ROTAS, true);

        return redirect($destino);
    }

    public function destroy(Request $request): HttpResponse
    {
        AuditoriaLog::registrar(AcaoAuditoria::Logout, $request->user());

        $idioma = $request->session()->get('idioma');
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        $request->session()->put('idioma', $idioma);

        // Em celular compartilhado da barraquinha, nada da sessão fica no histórico.
        Inertia::clearHistory();

        return Inertia::location(route('login'));
    }
}
