<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Canal;
use App\Enums\FormaPagamento;
use App\Http\Apresentacao;
use App\Http\Controllers\Controller;
use App\Models\Feira;
use App\Models\Venda;
use App\Services\Financeiro\Filtro;
use App\Services\Financeiro\IndicadoresService;
use App\Services\PendenciasService;
use App\Services\PulsoService;
use App\Support\FeiraAtual;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PainelController extends Controller
{
    public const COLUNAS = ['nome', 'vendas', 'saidas', 'saldo', 'resultado', 'margem', 'qtd'];

    /**
     * Consolidado da feira, gráficos, pendências e tabela comparativa.
     * As props pesadas são closures: no tempo real o navegador recarrega só
     * algumas, e só essas são calculadas.
     */
    public function index(Request $request, IndicadoresService $indicadores, PendenciasService $pendencias, PulsoService $pulso): Response
    {
        $feira = FeiraAtual::obter();
        $filtro = Filtro::daRequisicao($request);
        $barraquinhas = $feira ? $feira->barraquinhas()->get() : collect();
        $ids = $barraquinhas->pluck('id')->all();

        $memo = null;
        $porBarraquinha = function () use (&$memo, $indicadores, $barraquinhas, $filtro) {
            return $memo ??= $indicadores->porBarraquinha($barraquinhas, $filtro);
        };

        $ordem = in_array($request->query('ordem'), self::COLUNAS, true) ? $request->query('ordem') : 'vendas';
        $direcao = $request->query('direcao') === 'asc' ? 'asc' : 'desc';

        return Inertia::render('admin/Painel', [
            // Primeiro: calculada antes dos dados, então uma venda que entre no
            // meio do request muda o pulso e provoca nova recarga.
            'versao' => fn () => $this->versao($pulso, $feira, $ids),
            'feira' => $feira ? [
                'id' => $feira->id,
                'nome' => $feira->nome,
                'status' => Apresentacao::enum($feira->status),
                'dataInicio' => $feira->data_inicio->toDateString(),
                'dataFim' => $feira->data_fim->toDateString(),
            ] : null,
            'filtro' => $filtro->paraQuery(),
            'linhas' => fn () => $barraquinhas
                ->map(fn ($b) => ['b' => $b, 'ind' => $porBarraquinha()[$b->id]])
                ->sortBy(fn ($l) => $ordem === 'nome' ? mb_strtolower($l['b']->nomeExibicao()) : $l['ind']->valor($ordem), SORT_REGULAR, $direcao === 'desc')
                ->map(fn ($l) => [
                    'barraquinha' => Apresentacao::barraquinha($l['b']),
                    'indicadores' => Apresentacao::indicadores($l['ind']),
                ])
                ->values(),
            'consolidado' => fn () => Apresentacao::indicadores($indicadores->consolidar($porBarraquinha())),
            'porTag' => fn () => $indicadores->porTag($ids, $filtro),
            'porPagamento' => fn () => $this->porPagamento($indicadores, $ids, $filtro),
            'serie' => fn () => $indicadores->serieDiaria($ids, $filtro),
            'ultimas' => fn () => $indicadores->ultimasVendas($ids, $filtro)->map(fn (Venda $v) => Apresentacao::venda($v)),
            'pendencias' => fn () => $feira ? $pendencias->daFeira($feira, $porBarraquinha()) : [],
            'ordem' => $ordem,
            'direcao' => $direcao,
            'canais' => Apresentacao::opcoes(Canal::cases()),
            'pagamentos' => Apresentacao::opcoes(FormaPagamento::cases()),
        ]);
    }

    /** Assinatura do estado da feira em uso, para o painel em tempo real. */
    public function pulso(PulsoService $pulso): JsonResponse
    {
        $feira = FeiraAtual::obter();
        $ids = $feira ? $feira->barraquinhas()->pluck('id')->all() : [];

        return response()->json(['versao' => $this->versao($pulso, $feira, $ids)]);
    }

    /** Vendas e lançamentos das barraquinhas + cadastro delas (nome, status, vagas). */
    private function versao(PulsoService $pulso, ?Feira $feira, array $ids): string
    {
        return $pulso->versao($ids, $feira ? $feira->id.'|'.$pulso->versaoBarraquinhas($feira->id) : null);
    }

    public function compararFeiras(IndicadoresService $indicadores): Response
    {
        return Inertia::render('admin/CompararFeiras', [
            'feiras' => $indicadores->porFeira()->map(fn ($f) => [
                'id' => $f->feira->id,
                'nome' => $f->feira->nome,
                'status' => Apresentacao::enum($f->feira->status),
                'barraquinhas' => $f->barraquinhas,
                'indicadores' => Apresentacao::indicadores($f->indicadores),
            ])->values(),
        ]);
    }

    private function porPagamento(IndicadoresService $indicadores, array $ids, Filtro $filtro): array
    {
        $totais = $indicadores->porPagamento($ids, $filtro);

        return array_map(fn (FormaPagamento $p) => [
            'pagamento' => Apresentacao::enum($p),
            'total' => $totais->get($p->value, 0.0),
        ], FormaPagamento::cases());
    }
}
