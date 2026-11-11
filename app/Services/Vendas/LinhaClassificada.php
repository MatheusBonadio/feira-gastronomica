<?php

namespace App\Services\Vendas;

use App\Models\VendaLinha;

/** Uma linha do pedido já classificada. Valores monetários em centavos. */
final class LinhaClassificada
{
    /** @param array<int, int> $componentes item_id => quantidade por unidade da linha */
    public function __construct(
        public readonly string $tag,
        public readonly string $descricao,
        public readonly int $quantidade,
        public readonly int $precoUnitario,
        public readonly int $descontoUnitario,
        public readonly ?int $itemId = null,
        public readonly ?int $comboId = null,
        public readonly ?int $comboNumero = null,
        public readonly array $componentes = [],
    ) {}

    public function total(): int
    {
        return $this->precoUnitario * $this->quantidade;
    }

    public function desconto(): int
    {
        return $this->descontoUnitario * $this->quantidade;
    }

    public function tagLabel(): string
    {
        return VendaLinha::rotuloTag($this->tag, $this->comboNumero);
    }

    public function paraArray(): array
    {
        return [
            'tag' => $this->tagLabel(),
            'combo' => $this->tag === VendaLinha::TAG_COMBO,
            'descricao' => $this->descricao,
            'quantidade' => $this->quantidade,
            'preco_unitario' => $this->precoUnitario / 100,
            'desconto' => $this->desconto() / 100,
            'total' => $this->total() / 100,
        ];
    }
}
