<?php

namespace App\Http\Middleware;

use App\Models\Feira;
use App\Support\FeiraAtual;
use App\Support\Loja;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
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
                ],
                'barraquinha' => $user->ehBarraquinha() ? [
                    'id' => $user->barraquinha->id,
                    'nome' => $user->barraquinha->nomeExibicao(),
                    'feira' => $user->barraquinha->feira->nome,
                    'feiraEncerrada' => $user->barraquinha->feira->estaEncerrada(),
                ] : null,
            ] : null,
            // Seletor de feira do admin (cada feira é uma edição independente).
            'seletorFeira' => fn () => $user?->ehAdmin() ? [
                'atual' => FeiraAtual::obter()?->only(['id', 'nome']),
                // Atalhos da sidebar para as barraquinhas da feira em uso.
                'barraquinhas' => FeiraAtual::obter()?->barraquinhas()->whereNotNull('nome')->get(['id', 'nome', 'posicao', 'status'])
                    ->map(fn ($b) => ['id' => $b->id, 'nome' => $b->nome, 'bloqueada' => ! $b->estaAtiva()]) ?? [],
                'lista' => Feira::recentes()->get(['id', 'nome', 'status'])->map(fn (Feira $f) => [
                    'id' => $f->id, 'nome' => $f->nome, 'status' => $f->status->label(),
                ]),
            ] : null,
            // Barraquinha em foco nas telas compartilhadas (itens, combos, vendas...).
            'loja' => fn () => $this->loja($request),
            // Mensagens de sucesso/erro após uma ação. (A senha gerada vai à parte, por Inertia::flash.)
            'mensagens' => fn () => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }

    /**
     * Dicionário do idioma ativo (lang/{idioma}.json), enviado uma vez e lembrado
     * pelo cliente. As chaves das telas são as próprias frases em português; o
     * pt_BR.json só traduz os textos internos (em inglês) dos componentes BoardUI.
     */
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

        // Inclui páginas de erro: sem foco definido, simplesmente não há loja.
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
