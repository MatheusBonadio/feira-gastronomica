<?php

namespace App\Http\Middleware;

use App\Models\Feira;
use App\Support\FeiraAtual;
use App\Support\Loja;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    public const ENVIAR_ROTAS = 'enviar_rotas';

    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'app' => [
                'nome' => config('app.name'),
                'idioma' => app()->getLocale(),
                'idiomas' => config('feira.idiomas'),
            ],
            'auth' => fn () => $user ? [
                'usuario' => [
                    'id' => $user->id,
                    'nome' => $user->nome,
                    'usuario' => $user->usuario,
                    'perfil' => $user->perfil->value,
                    'perfilLabel' => $user->perfil->label(),
                    'foto' => $user->fotoUrl(),
                ],
                'barraquinha' => $user->ehBarraquinha() ? [
                    'id' => $user->barraquinha->id,
                    'nome' => $user->barraquinha->nomeExibicao(),
                    'foto' => $user->barraquinha->fotoUrl(),
                    'feira' => $user->barraquinha->feira->nome,
                    'feiraEncerrada' => $user->barraquinha->feira->estaEncerrada(),
                ] : null,
            ] : null,
            'seletorFeira' => fn () => $user?->ehAdmin() ? [
                'atual' => FeiraAtual::obter()?->only(['id', 'nome']),
                'barraquinhas' => FeiraAtual::obter()?->barraquinhas()->whereNotNull('nome')->get(['id', 'nome', 'posicao', 'status', 'foto_path'])
                    ->map(fn ($b) => ['id' => $b->id, 'nome' => $b->nome, 'bloqueada' => ! $b->estaAtiva(), 'foto' => $b->fotoUrl()]) ?? [],
                'lista' => Feira::recentes()->get(['id', 'nome', 'status'])->map(fn (Feira $f) => [
                    'id' => $f->id, 'nome' => $f->nome, 'status' => $f->status->label(),
                ]),
            ] : null,
            'rotas' => fn () => $user && $request->hasSession() && $request->session()->pull(self::ENVIAR_ROTAS)
                ? (new Ziggy($user->perfil->value))->toArray()
                : null,
            'loja' => fn () => $this->loja($request),
            'mensagens' => fn () => [
                'success' => $request->hasSession() ? $request->session()->get('success') : null,
                'error' => $request->hasSession() ? $request->session()->get('error') : null,
            ],
        ];
    }

    public function shareOnce(Request $request): array
    {
        return [
            'traducoes' => Inertia::once(fn () => $this->traducoes()),
        ];
    }

    private function traducoes(): array
    {
        $arquivo = lang_path(app()->getLocale().'.json');

        return is_file($arquivo) ? json_decode((string) file_get_contents($arquivo), true) : [];
    }

    private function loja(Request $request): ?array
    {
        $user = $request->user();
        $naRotaDaLoja = $request->routeIs('barraquinha.*', 'admin.loja.*');

        $loja = app(Loja::class);

        if (! $user || ! $naRotaDaLoja || ! $loja->temFoco()) {
            return null;
        }

        $barraquinha = $loja->barraquinha()->loadMissing('feira');

        return [
            'id' => $barraquinha->id,
            'nome' => $barraquinha->nomeExibicao(),
            'feira' => $barraquinha->feira->nome,
            'encerrada' => $barraquinha->feira->estaEncerrada(),
            'bloqueada' => ! $barraquinha->estaAtiva(),
            'prefixo' => $user->ehAdmin() ? 'admin.loja.' : 'barraquinha.',
            'parametros' => $user->ehAdmin() ? ['barraquinha' => $barraquinha->id] : (object) [],
            'podeVender' => $user->ehBarraquinha(),
        ];
    }
}
