<?php

namespace App\Http\Controllers\Loja;

use App\Enums\Canal;
use App\Enums\FormaPagamento;
use App\Http\Apresentacao;
use App\Http\Controllers\Controller;
use App\Models\Barraquinha;
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
            'canais' => Apresentacao::opcoes(Canal::cases()),
            'pagamentos' => Apresentacao::opcoes(FormaPagamento::cases()),
        ]);
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
