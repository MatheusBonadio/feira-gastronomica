<?php

namespace App\Providers;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Barraquinha;
use App\Support\Loja;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\ExceptionResponse;
use Inertia\Inertia;
use Throwable;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(Loja::class);
    }

    public function boot(): void
    {
        Route::model('barraquinha', Barraquinha::class);

        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
        Password::defaults(fn () => Password::min(8)->letters()->numbers());

        $this->paginasDeErro();
    }

    private function paginasDeErro(): void
    {
        Inertia::handleExceptionsUsing(function (ExceptionResponse $resposta) {
            $status = $resposta->statusCode();
            $request = $resposta->request;

            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return null;
            }

            if ($request->is('build/*', 'brand/*', 'fotos/*', '.well-known/*')) {
                return null;
            }

            if ($status === 419) {
                return back()->with('error', __('A página expirou. Tente novamente.'));
            }

            // Em desenvolvimento, erro 5xx continua mostrando a página de debug do Laravel.
            if ($status < 400 || (config('app.debug') && $status >= 500)) {
                return null;
            }

            // Toda falha vira a página Erro: HTML numa visita Inertia abriria o diálogo de erro por cima da tela.
            $props = ['status' => $status, 'mensagem' => $status === 422 ? $resposta->exception->getMessage() : null];

            try {
                return $resposta->render('Erro', $props)->withSharedData()->toResponse($request);
            } catch (Throwable) {
                // Os dados compartilhados consultam o banco; se ele caiu no meio da requisição, a página sai só com o essencial.
                Inertia::flushShared();

                return (new ExceptionResponse($resposta->exception, $request, $resposta->response, app(Router::class), app(Kernel::class)))
                    ->render('Erro', [...$props, ...HandleInertiaRequests::essenciais()])
                    ->toResponse($request);
            }
        });
    }
}
