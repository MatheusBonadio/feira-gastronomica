<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\DefinirIdioma;
use App\Http\Middleware\ExigirTrocaDeSenha;
use App\Http\Middleware\GarantirAcessoAtivo;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LojaCoerente;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Env;

/*
 * O .env só vai para $_SERVER/$_ENV, que são de cada requisição, e nunca para
 * putenv(), que é do processo inteiro. No Apache do Windows (XAMPP, PHP com
 * threads) uma requisição desfazia o putenv da outra no meio do caminho: a
 * outra ficava sem APP_KEY, caía em "production" e respondia 500.
 */
Env::disablePutenv();

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(SecurityHeaders::class);

        $middleware->web(append: [
            DefinirIdioma::class,
            HandleInertiaRequests::class,
        ]);

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
