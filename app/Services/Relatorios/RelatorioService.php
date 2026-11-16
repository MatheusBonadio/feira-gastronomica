<?php

namespace App\Services\Relatorios;

use App\Enums\Canal;
use App\Enums\LancamentoCategoria;
use App\Models\Barraquinha;
use App\Models\Feira;
use App\Models\Lancamento;
use App\Models\Scopes\BarraquinhaScope;
use App\Models\Venda;
use App\Services\Financeiro\Filtro;
use App\Services\Financeiro\Indicadores;
use App\Services\Financeiro\IndicadoresService;
use Illuminate\Support\Collection;

/**
 * Monta os relatórios da seção 9. Quem chama decide o escopo: a barraquinha
 * só passa a si mesma; o admin passa uma, várias ou todas da feira.
 * Vendas canceladas aparecem marcadas e ficam fora dos totais.
 */
class RelatorioService
{
    public function __construct(private readonly IndicadoresService $indicadores) {}

    /** @param Collection<int, Barraquinha> $barraquinhas */
    public function gerar(TipoRelatorio $tipo, Feira $feira, Collection $barraquinhas, Filtro $filtro): Relatorio
    {
        $escopo = $barraquinhas->count() === 1 ? $barraquinhas->first()->nomeExibicao() : __('Consolidado');
        $relatorio = new Relatorio($tipo, $feira->nome, $escopo, $filtro->descricao(), now());
        $variasBarraquinhas = $barraquinhas->count() > 1;

        match ($tipo) {
            TipoRelatorio::VendasDetalhadas => $this->vendasDetalhadas($relatorio, $barraquinhas, $filtro, $variasBarraquinhas),
            TipoRelatorio::ResumoVendas => $this->resumoVendas($relatorio, $barraquinhas, $filtro),
            TipoRelatorio::EntradasSaidas => $this->entradasSaidas($relatorio, $barraquinhas, $filtro, $variasBarraquinhas),
            TipoRelatorio::Fechamento => $this->fechamento($relatorio, $barraquinhas, $filtro),
            TipoRelatorio::Comparativo => $this->comparativo($relatorio, $barraquinhas, $filtro),
        };

        return $relatorio;
    }

    private function vendasDetalhadas(Relatorio $r, Collection $barraquinhas, Filtro $filtro, bool $comBarraquinha): void
    {
        $vendas = $filtro->aplicarEmVendas(Venda::withoutGlobalScopes()->whereIn('barraquinha_id', $barraquinhas->pluck('id')))
            ->with(['linhas' => fn ($q) => $q->withoutGlobalScopes(), 'barraquinha'])
            ->orderBy('data_hora')
            ->get();

        $colunas = array_values(array_filter([
            __('Data'), __('Hora'), __('Venda'), $comBarraquinha ? __('Barraquinha') : null, __('Canal'),
            __('Item ou combo'), __('Tag'), __('Quantidade'), __('Preço unitário'), __('Desconto'), __('Total'),
            __('Pagamento'), __('Status'),
        ]));

        $linhas = [];
        $total = 0.0;
        $desconto = 0.0;
        foreach ($vendas as $venda) {
            foreach ($venda->linhas as $linha) {
                if (! $filtro->aceitaLinha($linha)) {
                    continue;
                }
                $linhas[] = array_values(array_filter([
                    data_formatada($venda->data_hora),
                    $venda->data_hora->format('H:i'),
                    '#'.$venda->numero,
                    $comBarraquinha ? $venda->barraquinha->nomeExibicao() : false,
                    $venda->canal->label(),
                    $linha->descricao,
                    $linha->tagLabel(),
                    $linha->quantidade,
                    (float) $linha->preco_unitario,
                    (float) $linha->desconto,
                    (float) $linha->total,
                    $venda->pagamento->label(),
                    $venda->status->label(),
                ], fn ($v) => $v !== false));

                if (! $venda->estaCancelada()) {
                    $total += (float) $linha->total;
                    $desconto += (float) $linha->desconto;
                }
            }
        }

        $rodape = array_fill(0, count($colunas), null);
        $rodape[0] = __('Total (sem canceladas)');
        $rodape[count($colunas) - 4] = $desconto;
        $rodape[count($colunas) - 3] = $total;

        $r->aba($r->tipo->label())->bloco($colunas, $linhas, $rodape);
    }

    private function resumoVendas(Relatorio $r, Collection $barraquinhas, Filtro $filtro): void
    {
        $grupos = $barraquinhas->count() > 1
            ? [__('Consolidado') => $barraquinhas, ...$barraquinhas->mapWithKeys(fn ($b) => [$b->nomeExibicao() => collect([$b])])->all()]
            : [$barraquinhas->first()->nomeExibicao() => $barraquinhas];

        foreach ($grupos as $nome => $grupo) {
            $ids = $grupo->pluck('id')->all();
            $ind = $this->indicadores->consolidar($this->indicadores->porBarraquinha($grupo, $filtro));

            $r->aba($nome)
                ->bloco(
                    [__('Canal'), __('Total')],
                    array_map(fn (Canal $c) => [$c->label(), $ind->vendasDoCanal($c)], Canal::cases()),
                    [__('Total'), $ind->vendas],
                    __('Por canal'),
                )
                ->bloco(
                    [__('Tag'), __('Ocorrências'), __('Quantidade'), __('Desconto'), __('Total')],
                    $this->indicadores->porTag($ids, $filtro)->map(fn ($t) => [$t->rotulo, $t->linhas, $t->quantidade, $t->desconto, $t->total])->all(),
                    null,
                    __('Por tag'),
                )
                ->bloco(
                    [__('Item'), __('Quantidade vendida'), __('Custo estimado')],
                    $this->indicadores->rankingItens($ids, $filtro, null)->map(fn ($i) => [$i->item_nome, $i->quantidade, $i->custo])->all(),
                    null,
                    __('Por item (inclui itens vendidos em combos)'),
                );
        }
    }

    private function entradasSaidas(Relatorio $r, Collection $barraquinhas, Filtro $filtro, bool $comBarraquinha): void
    {
        $lancamentos = $filtro->aplicarEmLancamentos(Lancamento::withoutGlobalScope(BarraquinhaScope::class)->whereIn('barraquinha_id', $barraquinhas->pluck('id')))
            ->with('barraquinha')
            ->orderBy('data')
            ->get();

        $colunas = array_values(array_filter([
            __('Data'), $comBarraquinha ? __('Barraquinha') : null, __('Tipo'), __('Grupo'), __('Categoria'), __('Descrição'), __('Valor'),
        ]));

        $linhas = $lancamentos->map(fn (Lancamento $l) => array_values(array_filter([
            data_formatada($l->data),
            $comBarraquinha ? $l->barraquinha->nomeExibicao() : false,
            $l->tipo->label(),
            LancamentoCategoria::grupoLabel($l->categoria->grupo()),
            $l->categoria->label(),
            $l->descricao,
            (float) $l->valor,
        ], fn ($v) => $v !== false)))->all();

        $r->aba($r->tipo->label())->bloco($colunas, $linhas);

        $porGrupo = $lancamentos->groupBy(fn (Lancamento $l) => $l->categoria->grupo())->map(fn ($g) => (float) $g->sum('valor'));
        $r->bloco(
            [__('Grupo'), __('Total')],
            collect([LancamentoCategoria::GRUPO_ENTRADA, LancamentoCategoria::GRUPO_CUSTO, LancamentoCategoria::GRUPO_DESPESA, LancamentoCategoria::GRUPO_INVESTIMENTO])
                ->map(fn ($g) => [LancamentoCategoria::grupoLabel($g), $porGrupo->get($g, 0.0)])->all(),
            null,
            __('Totais por grupo'),
        );
    }

    /** Um arquivo com uma aba por barraquinha e uma de consolidado (seção 9, regra 5). */
    private function fechamento(Relatorio $r, Collection $barraquinhas, Filtro $filtro): void
    {
        $porBarraquinha = $this->indicadores->porBarraquinha($barraquinhas, $filtro);

        if ($barraquinhas->count() > 1) {
            $this->blocoFechamento($r->aba(__('Consolidado')), $this->indicadores->consolidar($porBarraquinha));
        }

        foreach ($barraquinhas as $barraquinha) {
            $this->blocoFechamento($r->aba($barraquinha->nomeExibicao()), $porBarraquinha[$barraquinha->id]);
        }
    }

    private function blocoFechamento(Relatorio $r, Indicadores $i): void
    {
        $linhas = [[__('Entrada de vendas'), $i->vendas]];
        foreach (Canal::cases() as $canal) {
            $linhas[] = ['  '.$canal->label(), $i->vendasDoCanal($canal)];
        }

        $r->bloco([__('Indicador'), __('Valor')], [
            ...$linhas,
            [__('Outras entradas'), $i->outrasEntradas],
            [__('Custos'), $i->custos],
            [__('Despesas'), $i->despesas],
            [__('Investimento'), $i->investimento],
            [__('Resultado operacional'), $i->resultadoOperacional()],
            [__('Saldo de caixa'), $i->saldoCaixa()],
            [__('Margem'), percentual($i->margem())],
            [__('Número de vendas'), $i->qtdVendas],
        ]);
    }

    private function comparativo(Relatorio $r, Collection $barraquinhas, Filtro $filtro): void
    {
        $porBarraquinha = $this->indicadores->porBarraquinha($barraquinhas, $filtro);
        $consolidado = $this->indicadores->consolidar($porBarraquinha);

        $linhas = $barraquinhas->map(fn (Barraquinha $b) => $this->linhaComparativa($b->nomeExibicao(), $porBarraquinha[$b->id]))->all();

        $r->aba($r->tipo->label())->bloco(
            [__('Barraquinha'), __('Entrada de vendas'), __('Saídas'), __('Saldo de caixa'), __('Resultado operacional'), __('Margem'), __('Número de vendas')],
            $linhas,
            $this->linhaComparativa(__('Total'), $consolidado),
        );
    }

    private function linhaComparativa(string $nome, Indicadores $i): array
    {
        return [$nome, $i->vendas, $i->saidas(), $i->saldoCaixa(), $i->resultadoOperacional(), percentual($i->margem()), $i->qtdVendas];
    }
}
