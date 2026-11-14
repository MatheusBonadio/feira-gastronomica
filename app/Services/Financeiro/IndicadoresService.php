<?php

namespace App\Services\Financeiro;

use App\Enums\LancamentoCategoria;
use App\Enums\VendaStatus;
use App\Models\Barraquinha;
use App\Models\Feira;
use App\Models\Lancamento;
use App\Models\Venda;
use App\Models\VendaItem;
use App\Models\VendaLinha;
use Illuminate\Support\Collection;

class IndicadoresService
{
    /**
     * Indicadores por barraquinha, com poucas consultas agrupadas.
     *
     * @param  Collection<int, Barraquinha>  $barraquinhas
     * @return array<int, Indicadores> barraquinha_id => indicadores
     */
    public function porBarraquinha(Collection $barraquinhas, Filtro $filtro = new Filtro): array
    {
        $ids = $barraquinhas->pluck('id')->all();
        $resultado = [];
        foreach ($barraquinhas as $barraquinha) {
            $resultado[$barraquinha->id] = new Indicadores(meta: $barraquinha->meta_vendas ? (float) $barraquinha->meta_vendas : null);
        }

        if (! $ids) {
            return $resultado;
        }

        $vendas = $filtro->aplicarEmVendas(Venda::withoutGlobalScopes()->concluidas()->whereIn('barraquinha_id', $ids))
            ->selectRaw('barraquinha_id, canal, COUNT(*) as qtd, SUM(total) as total')
            ->groupBy('barraquinha_id', 'canal')
            ->get();

        foreach ($vendas as $linha) {
            $ind = $resultado[$linha->barraquinha_id];
            $ind->vendas += (float) $linha->total;
            $ind->qtdVendas += (int) $linha->qtd;
            $ind->vendasPorCanal[$linha->canal->value] = (float) $linha->total;
        }

        $lancamentos = $filtro->aplicarEmLancamentos(Lancamento::withoutGlobalScope(\App\Models\Scopes\BarraquinhaScope::class)->whereIn('barraquinha_id', $ids))
            ->selectRaw('barraquinha_id, categoria, SUM(valor) as total')
            ->groupBy('barraquinha_id', 'categoria')
            ->get();

        foreach ($lancamentos as $linha) {
            $ind = $resultado[$linha->barraquinha_id];
            $valor = (float) $linha->total;
            match ($linha->categoria->grupo()) {
                LancamentoCategoria::GRUPO_ENTRADA => $ind->outrasEntradas += $valor,
                LancamentoCategoria::GRUPO_CUSTO => $ind->custos += $valor,
                LancamentoCategoria::GRUPO_DESPESA => $ind->despesas += $valor,
                LancamentoCategoria::GRUPO_INVESTIMENTO => $ind->investimento += $valor,
            };
        }

        return $resultado;
    }

    public function daBarraquinha(Barraquinha $barraquinha, Filtro $filtro = new Filtro): Indicadores
    {
        return $this->porBarraquinha(collect([$barraquinha]), $filtro)[$barraquinha->id];
    }

    /** @param array<int, Indicadores> $porBarraquinha */
    public function consolidar(array $porBarraquinha): Indicadores
    {
        return array_reduce($porBarraquinha, fn (Indicadores $soma, Indicadores $i) => $soma->somar($i), new Indicadores);
    }

    /**
     * Quantas e quanto em Comum e em cada Combo N.
     *
     * @return Collection<int, object{tag: string, combo_numero: ?int, rotulo: string, linhas: int, quantidade: int, total: float, desconto: float}>
     */
    public function porTag(array $barraquinhaIds, Filtro $filtro = new Filtro): Collection
    {
        return VendaLinha::withoutGlobalScopes()
            ->whereIn('venda_linhas.barraquinha_id', $barraquinhaIds)
            ->whereHas('venda', fn ($q) => $filtro->aplicarEmVendas($q->withoutGlobalScopes()->concluidas()))
            ->when($filtro->tag, fn ($q) => $filtro->aplicarTag($q))
            ->selectRaw('tag, combo_numero, COUNT(*) as linhas, SUM(quantidade) as quantidade, SUM(total) as total, SUM(desconto) as desconto')
            ->groupBy('tag', 'combo_numero')
            ->orderByRaw('combo_numero IS NULL, combo_numero')
            ->toBase()
            ->get()
            ->map(fn ($l) => (object) [
                'tag' => $l->tag,
                'combo_numero' => $l->combo_numero !== null ? (int) $l->combo_numero : null,
                'rotulo' => VendaLinha::rotuloTag($l->tag, $l->combo_numero !== null ? (int) $l->combo_numero : null),
                'linhas' => (int) $l->linhas,
                'quantidade' => (int) $l->quantidade,
                'total' => (float) $l->total,
                'desconto' => (float) $l->desconto,
            ]);
    }

    /**
     * Itens mais vendidos, contando também os que saíram dentro de combos.
     *
     * @return Collection<int, object{item_id: int, item_nome: string, quantidade: int}>
     */
    public function rankingItens(array $barraquinhaIds, Filtro $filtro = new Filtro, ?int $limite = 10): Collection
    {
        return VendaItem::withoutGlobalScopes()
            ->whereIn('venda_itens.barraquinha_id', $barraquinhaIds)
            ->whereHas('venda', fn ($q) => $filtro->aplicarEmVendas($q->withoutGlobalScopes()->concluidas()))
            ->selectRaw('item_id, MAX(item_nome) as item_nome, SUM(quantidade) as quantidade, SUM(quantidade * COALESCE(custo_unitario, 0)) as custo')
            ->groupBy('item_id')
            ->orderByDesc('quantidade')
            ->when($limite, fn ($q) => $q->limit($limite))
            ->toBase()
            ->get()
            ->map(fn ($l) => (object) [
                'item_id' => (int) $l->item_id,
                'item_nome' => $l->item_nome,
                'quantidade' => (int) $l->quantidade,
                'custo' => (float) $l->custo,
            ]);
    }

    /**
     * Vendas por dia, para os gráficos e a faixa de dias do painel.
     *
     * @return Collection<int, array{dia: string, total: float, qtd: int}>
     */
    public function serieDiaria(array $barraquinhaIds, Filtro $filtro = new Filtro): Collection
    {
        if (! $barraquinhaIds) {
            return collect();
        }

        return $filtro->aplicarEmVendas(Venda::withoutGlobalScopes()->concluidas()->whereIn('barraquinha_id', $barraquinhaIds))
            ->selectRaw('DATE(data_hora) as dia, SUM(total) as total, COUNT(*) as qtd')
            ->groupByRaw('DATE(data_hora)')
            ->orderBy('dia')
            ->toBase()
            ->get()
            ->map(fn ($l) => ['dia' => substr((string) $l->dia, 0, 10), 'total' => (float) $l->total, 'qtd' => (int) $l->qtd])
            ->values();
    }

    /** @return Collection<int, Venda> as mais recentes, com linhas e barraquinha */
    public function ultimasVendas(array $barraquinhaIds, Filtro $filtro = new Filtro, int $limite = 6): Collection
    {
        if (! $barraquinhaIds) {
            return collect();
        }

        return $filtro->aplicarEmVendas(Venda::withoutGlobalScopes()->whereIn('barraquinha_id', $barraquinhaIds))
            ->with(['linhas' => fn ($q) => $q->withoutGlobalScopes(), 'barraquinha', 'operador'])
            ->latest('data_hora')
            ->latest('id')
            ->limit($limite)
            ->get();
    }

    /** @return Collection<string, float> pagamento => total */
    public function porPagamento(array $barraquinhaIds, Filtro $filtro = new Filtro): Collection
    {
        return $filtro->aplicarEmVendas(Venda::withoutGlobalScopes()->concluidas()->whereIn('barraquinha_id', $barraquinhaIds))
            ->selectRaw('pagamento, SUM(total) as total')
            ->groupBy('pagamento')
            ->toBase()
            ->pluck('total', 'pagamento')
            ->map(fn ($v) => (float) $v);
    }

    /**
     * Mesmos indicadores consolidados por feira, para comparar edições.
     *
     * @return Collection<int, object{feira: Feira, indicadores: Indicadores, barraquinhas: int}>
     */
    public function porFeira(): Collection
    {
        $feiras = Feira::recentes()->withCount('barraquinhas')->get();

        $vendas = Venda::withoutGlobalScopes()
            ->where('status', VendaStatus::Concluida->value)
            ->selectRaw('feira_id, canal, COUNT(*) as qtd, SUM(total) as total')
            ->groupBy('feira_id', 'canal')
            ->toBase()
            ->get()
            ->groupBy('feira_id');

        $lancamentos = Lancamento::withoutGlobalScope(\App\Models\Scopes\BarraquinhaScope::class)
            ->join('barraquinhas', 'barraquinhas.id', '=', 'lancamentos.barraquinha_id')
            ->selectRaw('barraquinhas.feira_id, lancamentos.categoria, SUM(lancamentos.valor) as total')
            ->groupBy('barraquinhas.feira_id', 'lancamentos.categoria')
            ->toBase()
            ->get()
            ->groupBy('feira_id');

        return $feiras->map(function (Feira $feira) use ($vendas, $lancamentos) {
            $ind = new Indicadores;
            foreach ($vendas->get($feira->id, []) as $l) {
                $ind->vendas += (float) $l->total;
                $ind->qtdVendas += (int) $l->qtd;
                $ind->vendasPorCanal[$l->canal] = (float) $l->total;
            }
            foreach ($lancamentos->get($feira->id, []) as $l) {
                $valor = (float) $l->total;
                match (LancamentoCategoria::from($l->categoria)->grupo()) {
                    LancamentoCategoria::GRUPO_ENTRADA => $ind->outrasEntradas += $valor,
                    LancamentoCategoria::GRUPO_CUSTO => $ind->custos += $valor,
                    LancamentoCategoria::GRUPO_DESPESA => $ind->despesas += $valor,
                    LancamentoCategoria::GRUPO_INVESTIMENTO => $ind->investimento += $valor,
                };
            }

            return (object) ['feira' => $feira, 'indicadores' => $ind, 'barraquinhas' => $feira->barraquinhas_count];
        });
    }
}
