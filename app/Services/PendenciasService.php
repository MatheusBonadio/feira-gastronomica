<?php

namespace App\Services;

use App\Models\Barraquinha;
use App\Models\Combo;
use App\Models\Feira;
use App\Models\Item;
use App\Models\Lancamento;
use App\Models\Scopes\BarraquinhaScope;
use App\Models\VendaItem;
use App\Services\Financeiro\Indicadores;
use App\Support\Loja;

class PendenciasService
{
    private const ESTOQUE_BAIXO = 5;

    public function daFeira(Feira $feira, array $indicadores): array
    {
        $barraquinhas = $feira->barraquinhas()->with('usuario')->get();
        $vagas = $barraquinhas->filter->ehVaga()->count();
        $semAcesso = $barraquinhas->reject->ehVaga()->filter(fn (Barraquinha $b) => ! $b->usuario)->count();
        $negativas = collect($indicadores)->filter(fn (Indicadores $i) => $i->resultadoOperacional() < 0)->count();
        $incompletos = Combo::withoutGlobalScopes()
            ->with('itens')
            ->whereIn('barraquinha_id', $barraquinhas->pluck('id'))
            ->ativos()
            ->get()
            ->filter->estaIncompleto()
            ->count();
        $barraquinhasIndex = route('admin.barraquinhas.index');

        return [
            $this->item(__('Preencher as vagas'), $vagas ? __(':n vagas ainda sem barraquinha.', ['n' => $vagas]) : __('Todas as vagas têm barraquinha.'), $vagas === 0, $barraquinhasIndex),
            $this->item(__('Criar os acessos das equipes'), $semAcesso ? __(':n barraquinhas sem login.', ['n' => $semAcesso]) : __('Todas as barraquinhas têm login.'), $semAcesso === 0, $barraquinhasIndex),
            $this->item(__('Acompanhar resultados negativos'), $negativas ? __(':n barraquinhas com resultado operacional negativo.', ['n' => $negativas]) : __('Nenhuma barraquinha no negativo.'), $negativas === 0, null),
            $this->item(__('Corrigir combos incompletos'), $incompletos ? __(':n combos com itens inativos.', ['n' => $incompletos]) : __('Nenhum combo incompleto.'), $incompletos === 0, null),
        ];
    }

    public function daBarraquinha(Barraquinha $barraquinha): array
    {
        $loja = app(Loja::class);
        $itens = Item::withoutGlobalScopes()->where('barraquinha_id', $barraquinha->id)->ativos()->get();
        $combos = Combo::withoutGlobalScopes()->with('itens')->where('barraquinha_id', $barraquinha->id)->ativos()->get();
        $incompletos = $combos->filter->estaIncompleto()->count();
        $temCustos = Lancamento::withoutGlobalScope(BarraquinhaScope::class)->where('barraquinha_id', $barraquinha->id)->where('tipo', 'saida')->exists();

        $vendidos = VendaItem::withoutGlobalScopes()
            ->where('barraquinha_id', $barraquinha->id)
            ->whereHas('venda', fn ($q) => $q->withoutGlobalScopes()->concluidas())
            ->selectRaw('item_id, SUM(quantidade) as qtd')
            ->groupBy('item_id')
            ->toBase()
            ->pluck('qtd', 'item_id');
        $acabando = $itens->filter(fn (Item $i) => $i->estoque_inicial !== null && $i->estoqueRestante((int) ($vendidos[$i->id] ?? 0)) <= self::ESTOQUE_BAIXO)->count();

        return [
            $this->item(__('Cadastrar os itens'), $itens->isEmpty() ? __('Nenhum item ativo para vender.') : __(':n itens ativos.', ['n' => $itens->count()]), $itens->isNotEmpty(), $loja->rota('itens.index')),
            $this->item(__('Montar os combos'), $combos->isEmpty() ? __('Combos dão desconto automático no PDV.') : __(':n combos ativos.', ['n' => $combos->count()]), $combos->isNotEmpty(), $loja->rota('combos.index')),
            $this->item(__('Corrigir combos incompletos'), $incompletos ? __(':n combos com itens inativos.', ['n' => $incompletos]) : __('Nenhum combo incompleto.'), $incompletos === 0, $loja->rota('combos.index')),
            $this->item(__('Repor estoque'), $acabando ? __(':n itens acabando ou esgotados.', ['n' => $acabando]) : __('Estoque em dia.'), $acabando === 0, $loja->rota('itens.index')),
            $this->item(__('Lançar custos e despesas'), $temCustos ? __('Saídas registradas.') : __('Sem custos, o resultado operacional fica inflado.'), $temCustos, $loja->rota('lancamentos.index')),
        ];
    }

    private function item(string $titulo, string $descricao, bool $feito, ?string $href): array
    {
        return compact('titulo', 'descricao', 'feito', 'href');
    }
}
