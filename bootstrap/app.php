<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\DefinirContextoRls;
use App\Http\Middleware\DefinirIdioma;
use App\Http\Middleware\ExigirTrocaDeSenha;
use App\Http\Middleware\GarantirAcessoAtivo;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LojaCoerente;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\SubstituteBindings;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(SecurityHeaders::class);

        $middleware->web(append: [
            DefinirIdioma::class,
            DefinirContextoRls::class,
            HandleInertiaRequests::class,
        ]);

        // O contexto de RLS precisa existir antes do route model binding,
        // senão as views do banco escondem até os registros da própria barraquinha.
        $middleware->prependToPriorityList(SubstituteBindings::class, DefinirContextoRls::class);

        $middleware->redirectGuestsTo(fn () => route('login'));
        $middleware->redirectUsersTo(fn () => route(auth()->user()->perfil->homeRoute()));

        $middleware->alias([
            'perfil' => CheckRole::class,
            'acesso.ativo' => GarantirAcessoAtivo::class,
            'senha.trocada' => ExigirTrocaDeSenha::class,
            'loja.coerente' => LojaCoerente::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontFlash(['password', 'password_confirmation', 'senha', 'senha_confirmation', 'senha_atual']);
    })->create();
