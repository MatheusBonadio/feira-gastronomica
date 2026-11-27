<?php

namespace App\Http;

use App\Enums\Canal;
use App\Models\Barraquinha;
use App\Models\Combo;
use App\Models\Item;
use App\Models\Lancamento;
use App\Models\Venda;
use App\Models\VendaLinha;
use App\Services\Financeiro\Indicadores;
use BackedEnum;
use Illuminate\Pagination\LengthAwarePaginator;

class Apresentacao
{
    public static function enum(?BackedEnum $enum): ?array
    {
        return $enum ? ['valor' => $enum->value, 'label' => $enum->label()] : null;
    }

    public static function opcoes(array $casos): array
    {
        return array_map(fn (BackedEnum $c) => self::enum($c), $casos);
    }

    public static function paginacao(LengthAwarePaginator $paginas, callable $mapa): array
    {
        return [
            'dados' => collect($paginas->items())->map($mapa)->values(),
            'pagina' => $paginas->currentPage(),
            'ultimaPagina' => $paginas->lastPage(),
            'total' => $paginas->total(),
            'anterior' => $paginas->previousPageUrl(),
            'proxima' => $paginas->nextPageUrl(),
        ];
    }

    public static function barraquinha(Barraquinha $b): array
    {
        return [
            'id' => $b->id,
            'posicao' => $b->posicao,
            'nome' => $b->nomeExibicao(),
            'vaga' => $b->ehVaga(),
            'responsaveis' => $b->responsaveis,
            'status' => self::enum($b->status),
            'meta' => $b->meta_vendas !== null ? (float) $b->meta_vendas : null,
            'foto' => $b->fotoUrl(),
        ];
    }

    public static function item(Item $item, ?int $vendidos = null): array
    {
        $precos = [];
        foreach (Canal::cases() as $canal) {
            $preco = $item->precos->first(fn ($p) => $p->canal === $canal);
            $precos[$canal->value] = $preco ? (float) $preco->preco : null;
        }

        return [
            'id' => $item->id,
            'nome' => $item->nome,
            'descricao' => $item->descricao,
            'categoriaId' => $item->categoria_id,
            'categoria' => $item->relationLoaded('categoria') ? $item->categoria?->nomeExibicao() : null,
            'custo' => $item->custo !== null ? (float) $item->custo : null,
            'estoqueInicial' => $item->estoque_inicial,
            'estoqueRestante' => $vendidos !== null ? $item->estoqueRestante($vendidos) : null,
            'vendidos' => $vendidos,
            'ativo' => $item->ativo,
            'precos' => $precos,
            'precoFeira' => $item->precoPara(Canal::PADRAO),
        ];
    }

    public static function combo(Combo $combo): array
    {
        $canais = [];
        foreach (Canal::cases() as $canal) {
            $regra = $combo->regraPara($canal);
            $canais[$canal->value] = $regra ? [
                'tipoDesconto' => $regra->tipo_desconto->value,
                'valor' => (float) $regra->valor,
                'preco' => $combo->precoPara($canal),
                'somaAvulsa' => $combo->somaAvulsa($canal),
            ] : null;
        }

        return [
            'id' => $combo->id,
            'numero' => $combo->numero,
            'tag' => $combo->tag(),
            'nome' => $combo->nome,
            'ativo' => $combo->ativo,
            'incompleto' => $combo->estaIncompleto(),
            'canais' => $canais,
            'vendas' => (int) ($combo->vendas_count ?? 0),
            'itens' => $combo->itens->map(fn (Item $i) => [
                'id' => $i->id,
                'nome' => $i->nome,
                'quantidade' => (int) $i->pivot->quantidade,
                'ativo' => $i->ativo,
            ])->values(),
        ];
    }

    public static function venda(Venda $venda, bool $detalhe = false): array
    {
        $dados = [
            'id' => $venda->id,
            'barraquinhaId' => $venda->barraquinha_id,
            'numero' => $venda->numero,
            'dataHora' => $venda->data_hora->toIso8601String(),
            'canal' => self::enum($venda->canal),
            'pagamento' => self::enum($venda->pagamento),
            'status' => self::enum($venda->status),
            'cancelada' => $venda->estaCancelada(),
            'subtotal' => (float) $venda->subtotal,
            'desconto' => (float) $venda->desconto,
            'total' => (float) $venda->total,
            'resumo' => $venda->resumo(),
            'operador' => $venda->operador?->nome,
            'barraquinha' => $venda->relationLoaded('barraquinha') ? $venda->barraquinha?->nomeExibicao() : null,
            'barraquinhaFoto' => $venda->relationLoaded('barraquinha') ? $venda->barraquinha?->fotoUrl() : null,
        ];

        if ($detalhe) {
            $dados += [
                'linhas' => $venda->linhas->map(fn (VendaLinha $l) => [
                    'descricao' => $l->descricao,
                    'tag' => $l->tagLabel(),
                    'ehCombo' => $l->tag === VendaLinha::TAG_COMBO,
                    'quantidade' => $l->quantidade,
                    'precoUnitario' => (float) $l->preco_unitario,
                    'desconto' => (float) $l->desconto,
                    'total' => (float) $l->total,
                ])->values(),
                'motivoCancelamento' => $venda->motivo_cancelamento,
                'canceladaPor' => $venda->canceladaPor?->nome,
                'canceladaEm' => $venda->cancelada_em?->toIso8601String(),
            ];
        }

        return $dados;
    }

    public static function lancamento(Lancamento $l): array
    {
        return [
            'id' => $l->id,
            'tipo' => self::enum($l->tipo),
            'categoria' => self::enum($l->categoria),
            'grupo' => \App\Enums\LancamentoCategoria::grupoLabel($l->categoria->grupo()),
            'descricao' => $l->descricao,
            'valor' => (float) $l->valor,
            'data' => $l->data->toDateString(),
            'temComprovante' => (bool) $l->comprovante_path,
            'autor' => $l->autor?->nome,
        ];
    }

    public static function indicadores(Indicadores $i): array
    {
        $canais = [];
        foreach (Canal::cases() as $canal) {
            $canais[] = ['canal' => self::enum($canal), 'total' => $i->vendasDoCanal($canal)];
        }

        return [
            'vendas' => $i->vendas,
            'qtdVendas' => $i->qtdVendas,
            'porCanal' => $canais,
            'outrasEntradas' => $i->outrasEntradas,
            'custos' => $i->custos,
            'despesas' => $i->despesas,
            'investimento' => $i->investimento,
            'saidas' => $i->saidas(),
            'resultado' => $i->resultadoOperacional(),
            'saldo' => $i->saldoCaixa(),
            'margem' => $i->margem(),
            'meta' => $i->meta,
            'progressoMeta' => $i->progressoMeta(),
        ];
    }
}
