<?php

namespace App\Http\Controllers\Loja;

use App\Enums\Canal;
use App\Enums\FormaPagamento;
use App\Http\Apresentacao;
use App\Http\Controllers\Controller;
use App\Models\Barraquinha;
use App\Models\Item;
use App\Models\Venda;
use App\Services\Financeiro\Filtro;
use App\Services\Financeiro\IndicadoresService;
use App\Services\PendenciasService;
use App\Services\PulsoService;
use App\Support\Loja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Painel da barraquinha (o admin vê o mesmo painel). Atualiza em tempo real pelo pulso. */
class PainelController extends Controller
{
    public function index(Request $request, Loja $loja, IndicadoresService $indicadores, PendenciasService $pendencias, PulsoService $pulso): Response
    {
        $barraquinha = $loja->barraquinha()->load('feira');
        $filtro = Filtro::daRequisicao($request);
        $ids = [$barraquinha->id];

        return Inertia::render('loja/Painel', [
            // Primeiro, antes dos dados: ver Admin\PainelController.
            'versao' => fn () => $this->versao($pulso, $barraquinha),
            'barraquinha' => Apresentacao::barraquinha($barraquinha),
            'filtro' => $filtro->paraQuery(),
            'indicadores' => fn () => Apresentacao::indicadores($indicadores->daBarraquinha($barraquinha, $filtro)),
            'porTag' => fn () => $indicadores->porTag($ids, $filtro),
            'ranking' => fn () => $indicadores->rankingItens($ids, $filtro),
            'porPagamento' => function () use ($indicadores, $ids, $filtro) {
                $totais = $indicadores->porPagamento($ids, $filtro);

                return array_map(fn (FormaPagamento $p) => [
                    'pagamento' => Apresentacao::enum($p),
                    'total' => $totais->get($p->value, 0.0),
                ], FormaPagamento::cases());
            },
            'serie' => fn () => $indicadores->serieDiaria($ids, $filtro),
            'ultimas' => fn () => $indicadores->ultimasVendas($ids, $filtro)->map(fn (Venda $v) => Apresentacao::venda($v)),
            'pendencias' => fn () => $pendencias->daBarraquinha($barraquinha),
            'saidasCategoria' => fn () => \App\Http\Controllers\Admin\PainelController::saidasCategoria($indicadores, $ids, $filtro),
            'estoque' => fn () => $this->estoque($barraquinha, $indicadores),
            'canais' => Apresentacao::opcoes(Canal::cases()),
            'pagamentos' => Apresentacao::opcoes(FormaPagamento::cases()),
        ]);
    }

    /** Pendências da barraquinha, para o sino da topbar. */
    public function pendencias(Loja $loja, PendenciasService $pendencias): JsonResponse
    {
        return response()->json(['pendencias' => $pendencias->daBarraquinha($loja->barraquinha())]);
    }

    /**
     * Itens com controle de estoque, os mais perto de acabar primeiro.
     * O estoque considera todas as vendas concluídas (não segue o filtro).
     */
    private function estoque(Barraquinha $barraquinha, IndicadoresService $indicadores): array
    {
        $vendidos = $indicadores->rankingItens([$barraquinha->id], new Filtro, null)->pluck('quantidade', 'item_id');

        return Item::withoutGlobalScopes()
            ->where('barraquinha_id', $barraquinha->id)
            ->where('ativo', true)
            ->whereNotNull('estoque_inicial')
            ->get()
            ->map(fn (Item $item) => [
                'id' => $item->id,
                'nome' => $item->nome,
                'inicial' => $item->estoque_inicial,
                'vendidos' => (int) ($vendidos[$item->id] ?? 0),
                'restante' => $item->estoqueRestante((int) ($vendidos[$item->id] ?? 0)),
            ])
            ->sortBy('restante')
            ->take(6)
            ->values()
            ->all();
    }

    public function pulso(Loja $loja, PulsoService $pulso): JsonResponse
    {
        return response()->json(['versao' => $this->versao($pulso, $loja->barraquinha())]);
    }

    private function versao(PulsoService $pulso, Barraquinha $barraquinha): string
    {
        return $pulso->versao([$barraquinha->id], $barraquinha->updated_at?->toIso8601String());
    }
}
