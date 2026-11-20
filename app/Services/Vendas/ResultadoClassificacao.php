<?php

namespace App\Services\Vendas;

use App\Models\VendaLinha;

final class ResultadoClassificacao
{
    public function __construct(public readonly array $linhas) {}

    public function total(): int
    {
        return array_sum(array_map(fn (LinhaClassificada $l) => $l->total(), $this->linhas));
    }

    public function desconto(): int
    {
        return array_sum(array_map(fn (LinhaClassificada $l) => $l->desconto(), $this->linhas));
    }

    public function subtotal(): int
    {
        return $this->total() + $this->desconto();
    }

    public function vazio(): bool
    {
        return $this->linhas === [];
    }

    public function resumo(): string
    {
        $partes = [];
        foreach ($this->linhas as $linha) {
            if ($linha->tag === VendaLinha::TAG_COMBO) {
                $partes[] = $linha->tagLabel().($linha->quantidade > 1 ? " × {$linha->quantidade}" : '');
            }
        }
        if (array_filter($this->linhas, fn ($l) => $l->tag === VendaLinha::TAG_COMUM)) {
            $partes[] = __('Comum');
        }

        return implode(' + ', $partes);
    }

    public function paraArray(): array
    {
        return [
            'linhas' => array_map(fn (LinhaClassificada $l) => $l->paraArray(), $this->linhas),
            'resumo' => $this->resumo(),
            'subtotal' => $this->subtotal() / 100,
            'desconto' => $this->desconto() / 100,
            'total' => $this->total() / 100,
            'subtotal_formatado' => moeda($this->subtotal() / 100),
            'desconto_formatado' => moeda($this->desconto() / 100),
            'total_formatado' => moeda($this->total() / 100),
        ];
    }
}
