<?php

namespace App\Http\Controllers\Loja;

use App\Enums\AcaoAuditoria;
use App\Enums\Canal;
use App\Enums\FormaPagamento;
use App\Http\Controllers\Controller;
use App\Models\AuditoriaLog;
use App\Models\Combo;
use App\Models\Feira;
use App\Services\Financeiro\Filtro;
use App\Services\Relatorios\Exportador;
use App\Services\Relatorios\RelatorioService;
use App\Services\Relatorios\TipoRelatorio;
use App\Support\FeiraAtual;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use App\Http\Apresentacao;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Exportação de relatórios. O escopo nunca vem da tela para a barraquinha:
 * ela exporta só os próprios dados, sem total geral da feira.
 * O admin escolhe a feira e uma, várias ou todas as barraquinhas.
 */
class RelatorioController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $admin = $request->user()->ehAdmin();
        $feira = $admin ? FeiraAtual::obter() : $request->user()->barraquinha->feira;

        return Inertia::render('loja/Relatorios', [
            'admin' => $admin,
            'feiraAtual' => $feira?->id,
            'feiras' => ($admin ? Feira::recentes()->get() : collect([$feira]))->map(fn (Feira $f) => ['id' => $f->id, 'nome' => $f->nome]),
            'barraquinhas' => $admin
                ? ($feira?->barraquinhas()->whereNotNull('nome')->get() ?? collect())->map(fn ($b) => ['id' => $b->id, 'nome' => $b->nomeExibicao()])->values()
                : [],
            'tipos' => array_map(fn (TipoRelatorio $t) => [...Apresentacao::enum($t), 'descricao' => $t->descricao()], TipoRelatorio::disponiveis($admin)),
            'formatos' => Exportador::FORMATOS,
            'canais' => Apresentacao::opcoes(Canal::cases()),
            'pagamentos' => Apresentacao::opcoes(FormaPagamento::cases()),
            'numerosCombo' => Combo::query()->distinct()->orderBy('numero')->pluck('numero'),
            'rotaExportar' => route($admin ? 'admin.relatorios.exportar' : 'barraquinha.relatorios.exportar'),
        ]);
    }

    public function exportar(Request $request, RelatorioService $relatorios, Exportador $exportador): Response
    {
        $admin = $request->user()->ehAdmin();

        $dados = $request->validate([
            'tipo' => ['required', Rule::enum(TipoRelatorio::class)],
            'formato' => ['required', Rule::in(Exportador::FORMATOS)],
            'feira_id' => [$admin ? 'required' : 'nullable', 'integer', 'exists:feiras,id'],
            'barraquinhas' => ['nullable', 'array'],
            'barraquinhas.*' => ['integer'],
            'de' => ['nullable', 'date'],
            'ate' => ['nullable', 'date', 'after_or_equal:de'],
        ], attributes: ['tipo' => __('relatório'), 'formato' => __('formato'), 'de' => __('data inicial'), 'ate' => __('data final')]);

        $tipo = TipoRelatorio::from($dados['tipo']);
        abort_if($tipo->somenteAdmin() && ! $admin, 403);

        [$feira, $barraquinhas] = $admin
            ? $this->escopoAdmin((int) $dados['feira_id'], $dados['barraquinhas'] ?? [])
            : [$request->user()->barraquinha->feira, collect([$request->user()->barraquinha])];

        abort_if($barraquinhas->isEmpty(), 422, __('Nenhuma barraquinha no escopo escolhido.'));

        $filtro = Filtro::daRequisicao($request);
        $relatorio = $relatorios->gerar($tipo, $feira, $barraquinhas, $filtro);

        AuditoriaLog::registrar(AcaoAuditoria::Exportacao, 'Relatorio', detalhe: [
            'tipo' => $tipo->value,
            'formato' => $dados['formato'],
            'feira' => $feira->id,
            'barraquinhas' => $barraquinhas->pluck('id')->all(),
            'filtros' => $filtro->paraQuery(),
        ]);

        return $exportador->responder($relatorio, $dados['formato']);
    }

    /** @return array{0: Feira, 1: Collection} */
    private function escopoAdmin(int $feiraId, array $ids): array
    {
        $feira = Feira::findOrFail($feiraId);
        $barraquinhas = $feira->barraquinhas()->whereNotNull('nome')
            ->when($ids, fn ($q) => $q->whereIn('id', $ids))
            ->get();

        return [$feira, $barraquinhas];
    }
}
