<?php

namespace App\Providers;

use App\Models\Barraquinha;
use App\Support\Loja;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\ExceptionResponse;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(Loja::class);
    }

    public function boot(): void
    {
        // Binding explícito: {barraquinha} vira model mesmo sem aparecer na assinatura do controller.
        Route::model('barraquinha', Barraquinha::class);

        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
        Password::defaults(fn () => Password::min(8)->letters()->numbers());

        $this->paginasDeErro();
    }

    /** Erros viram uma página React no próprio layout, em vez da tela padrão do Laravel. */
    private function paginasDeErro(): void
    {
        Inertia::handleExceptionsUsing(function (ExceptionResponse $resposta) {
            $status = $resposta->statusCode();
            $request = $resposta->request;

            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return null;
            }

            if ($status === 419) {
                return back()->with('error', __('A página expirou. Tente novamente.'));
            }

            $sempre = [403, 404, 422, 429];
            $semDebug = [500, 503];

            if (in_array($status, $sempre, true) || (! config('app.debug') && in_array($status, $semDebug, true))) {
                return $resposta->render('Erro', [
                    'status' => $status,
                    'mensagem' => $status === 422 ? $resposta->exception->getMessage() : null,
                ])->withSharedData();
            }

            return null;
        });
    }
}
