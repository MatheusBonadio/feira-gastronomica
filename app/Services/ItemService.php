<?php

namespace App\Services;

use App\Enums\AcaoAuditoria;
use App\Enums\Canal;
use App\Models\AuditoriaLog;
use App\Models\Barraquinha;
use App\Models\ComboItem;
use App\Models\Item;
use App\Models\ItemPreco;
use App\Services\Vendas\VendaService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ItemService
{
    public function __construct(private readonly VendaService $vendas) {}

    public function criar(Barraquinha $barraquinha, array $dados): Item
    {
        $this->vendas->garantirFeiraAberta($barraquinha);

        return DB::transaction(function () use ($barraquinha, $dados) {
            $item = Item::create([...$this->campos($dados), 'barraquinha_id' => $barraquinha->id]);
            $this->salvarPrecos($item, $dados['precos'] ?? []);

            AuditoriaLog::registrar(AcaoAuditoria::ItemCriado, $item, detalhe: ['nome' => $item->nome], barraquinhaId: $barraquinha->id);

            return $item;
        });
    }

    /** Alterar o preço vale para as próximas vendas; as já registradas guardam o preço da época. */
    public function atualizar(Item $item, array $dados): Item
    {
        $this->vendas->garantirFeiraAberta($item->barraquinha);

        return DB::transaction(function () use ($item, $dados) {
            $antes = $item->only(['nome', 'categoria_id', 'custo', 'estoque_inicial', 'ativo']);
            $item->update($this->campos($dados));
            $alteracoesPreco = $this->salvarPrecos($item, $dados['precos'] ?? []);

            AuditoriaLog::registrar(AcaoAuditoria::ItemAlterado, $item, detalhe: [
                'antes' => $antes,
                'depois' => $item->only(array_keys($antes)),
            ], barraquinhaId: $item->barraquinha_id);

            if ($alteracoesPreco) {
                AuditoriaLog::registrar(AcaoAuditoria::PrecoAlterado, $item, detalhe: $alteracoesPreco, barraquinhaId: $item->barraquinha_id);
            }

            return $item;
        });
    }

    /** Item já vendido (ou dentro de combo) não é excluído, apenas inativado. */
    public function excluir(Item $item): void
    {
        $this->vendas->garantirFeiraAberta($item->barraquinha);

        if ($item->foiVendido()) {
            throw ValidationException::withMessages(['item' => __('Este item já foi vendido: inative-o em vez de excluir.')]);
        }

        if (ComboItem::withoutGlobalScopes()->where('item_id', $item->id)->exists()) {
            throw ValidationException::withMessages(['item' => __('Este item faz parte de um combo: retire-o do combo ou inative-o.')]);
        }

        AuditoriaLog::registrar(AcaoAuditoria::ItemExcluido, $item, detalhe: ['nome' => $item->nome], barraquinhaId: $item->barraquinha_id);
        $item->delete();
    }

    private function campos(array $dados): array
    {
        return [
            'categoria_id' => $dados['categoria_id'],
            'nome' => trim($dados['nome']),
            'descricao' => $dados['descricao'] ?? null,
            'custo' => $dados['custo'] ?? null,
            'estoque_inicial' => $dados['estoque_inicial'] ?? null,
            'ativo' => (bool) ($dados['ativo'] ?? true),
        ];
    }

    /**
     * Preço de Feira é obrigatório (padrão); pré-venda e pós-evento são opcionais.
     *
     * @return array<string, array{de: ?float, para: ?float}> preços que mudaram
     */
    private function salvarPrecos(Item $item, array $precos): array
    {
        $atuais = ItemPreco::withoutGlobalScopes()->where('item_id', $item->id)->get()->keyBy(fn ($p) => $p->canal->value);
        $alteracoes = [];

        foreach (Canal::cases() as $canal) {
            $novo = isset($precos[$canal->value]) && $precos[$canal->value] !== '' ? round((float) $precos[$canal->value], 2) : null;
            $atual = $atuais->get($canal->value);
            $anterior = $atual ? (float) $atual->preco : null;

            if ($novo === $anterior) {
                continue;
            }

            if ($novo === null) {
                $atual->delete();
            } else {
                ItemPreco::withoutGlobalScopes()->updateOrCreate(
                    ['item_id' => $item->id, 'canal' => $canal->value],
                    ['barraquinha_id' => $item->barraquinha_id, 'preco' => $novo],
                );
            }

            if ($anterior !== null) {
                $alteracoes[$canal->value] = ['de' => $anterior, 'para' => $novo];
            }
        }

        $item->unsetRelation('precos');

        return $alteracoes;
    }
}
