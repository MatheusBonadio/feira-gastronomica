<?php

namespace App\Services\Vendas;

use App\Enums\AcaoAuditoria;
use App\Enums\Canal;
use App\Enums\FormaPagamento;
use App\Enums\VendaStatus;
use App\Models\AuditoriaLog;
use App\Models\Barraquinha;
use App\Models\Combo;
use App\Models\Item;
use App\Models\User;
use App\Models\Venda;
use App\Models\VendaItem;
use App\Models\VendaLinha;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VendaService
{
    public function __construct(private readonly ClassificadorVenda $classificador) {}

    public function simular(Barraquinha $barraquinha, Canal $canal, array $carrinho): ResultadoClassificacao
    {
        [$itens, $combos] = $this->catalogo($barraquinha, $canal);

        return $this->classificador->classificar($this->normalizar($carrinho, $itens), $itens, $combos);
    }

    public function registrar(
        Barraquinha $barraquinha,
        User $operador,
        Canal $canal,
        FormaPagamento $pagamento,
        array $carrinho,
    ): Venda {
        $this->garantirFeiraAberta($barraquinha);
        $this->garantirCanalAberto($barraquinha, $canal);

        return DB::transaction(function () use ($barraquinha, $operador, $canal, $pagamento, $carrinho) {
            [$itens, $combos] = $this->catalogo($barraquinha, $canal);
            $resultado = $this->classificador->classificar($this->normalizar($carrinho, $itens), $itens, $combos);

            if ($resultado->vazio()) {
                throw ValidationException::withMessages(['itens' => __('Adicione ao menos um item ao carrinho.')]);
            }

            $numero = (int) Venda::withoutGlobalScopes()
                ->where('barraquinha_id', $barraquinha->id)
                ->orderByDesc('numero')
                ->lockForUpdate()
                ->value('numero') + 1;

            $venda = Venda::create([
                'barraquinha_id' => $barraquinha->id,
                'feira_id' => $barraquinha->feira_id,
                'operador_id' => $operador->id,
                'numero' => $numero,
                'data_hora' => now(),
                'canal' => $canal,
                'pagamento' => $pagamento,
                'subtotal' => $resultado->subtotal() / 100,
                'desconto' => $resultado->desconto() / 100,
                'total' => $resultado->total() / 100,
                'status' => VendaStatus::Concluida,
            ]);

            $custos = Item::withoutGlobalScopes()->whereIn('id', array_keys($itens))->pluck('custo', 'id');

            foreach ($resultado->linhas as $linha) {
                $registro = VendaLinha::create([
                    'barraquinha_id' => $barraquinha->id,
                    'venda_id' => $venda->id,
                    'item_id' => $linha->itemId,
                    'combo_id' => $linha->comboId,
                    'descricao' => $linha->descricao,
                    'tag' => $linha->tag,
                    'combo_numero' => $linha->comboNumero,
                    'quantidade' => $linha->quantidade,
                    'preco_unitario' => $linha->precoUnitario / 100,
                    'desconto' => $linha->desconto() / 100,
                    'total' => $linha->total() / 100,
                ]);

                foreach ($linha->componentes as $itemId => $qtd) {
                    VendaItem::create([
                        'barraquinha_id' => $barraquinha->id,
                        'venda_id' => $venda->id,
                        'venda_linha_id' => $registro->id,
                        'item_id' => $itemId,
                        'item_nome' => $itens[$itemId]['nome'],
                        'quantidade' => $qtd * $linha->quantidade,
                        'custo_unitario' => $custos[$itemId] ?? null,
                    ]);
                }
            }

            return $venda->load('linhas');
        });
    }

    public function cancelar(Venda $venda, User $usuario, string $motivo): Venda
    {
        $this->garantirFeiraAberta($venda->barraquinha);

        if ($venda->estaCancelada()) {
            throw ValidationException::withMessages(['motivo' => __('Esta venda já está cancelada.')]);
        }

        $venda->update([
            'status' => VendaStatus::Cancelada,
            'motivo_cancelamento' => $motivo,
            'cancelada_por' => $usuario->id,
            'cancelada_em' => now(),
        ]);

        AuditoriaLog::registrar(AcaoAuditoria::VendaCancelada, $venda, detalhe: [
            'numero' => $venda->numero,
            'total' => (float) $venda->total,
            'motivo' => $motivo,
        ], barraquinhaId: $venda->barraquinha_id);

        return $venda;
    }

    public function garantirFeiraAberta(Barraquinha $barraquinha): void
    {
        if ($barraquinha->feira->estaEncerrada()) {
            throw ValidationException::withMessages([
                'feira' => __('A feira está encerrada: novos lançamentos estão bloqueados.'),
            ]);
        }
    }

    public function garantirCanalAberto(Barraquinha $barraquinha, Canal $canal): void
    {
        $feira = $barraquinha->feira;

        if ($canal === Canal::PreVenda && ! $feira->preVendaAberta()) {
            throw ValidationException::withMessages([
                'canal' => __('A pré-venda encerrou em :data. Registre a venda pelo canal Feira ou Pós-evento.', [
                    'data' => data_formatada($feira->data_corte_pre_venda, comHora: true),
                ]),
            ]);
        }
    }

    private function catalogo(Barraquinha $barraquinha, Canal $canal): array
    {
        $itens = Item::withoutGlobalScopes()
            ->with('precos')
            ->where('barraquinha_id', $barraquinha->id)
            ->ativos()
            ->get()
            ->mapWithKeys(fn (Item $i) => [$i->id => ['nome' => $i->nome, 'preco' => $i->precoPara($canal)]])
            ->all();

        $combos = Combo::withoutGlobalScopes()
            ->with('itens.precos')
            ->where('barraquinha_id', $barraquinha->id)
            ->ativos()
            ->get()
            ->filter(fn (Combo $c) => $c->aplicavel())
            ->map(fn (Combo $c) => [
                'id' => $c->id,
                'numero' => $c->numero,
                'nome' => $c->nome,
                'composicao' => $c->composicao(),
                'preco' => $c->precoPara($canal),
            ])
            ->values()
            ->all();

        return [$itens, $combos];
    }

    private function normalizar(array $carrinho, array $itens): array
    {
        $normalizado = [];
        foreach ($carrinho as $itemId => $quantidade) {
            $quantidade = (int) $quantidade;
            if (isset($itens[(int) $itemId]) && $quantidade > 0) {
                $normalizado[(int) $itemId] = min($quantidade, 999);
            }
        }

        return $normalizado;
    }
}
