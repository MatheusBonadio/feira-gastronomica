<?php

namespace App\Services\Financeiro;

use App\Enums\Canal;

final class Indicadores
{
    public function __construct(
        public float $vendas = 0,
        public int $qtdVendas = 0,
        public array $vendasPorCanal = [],
        public float $outrasEntradas = 0,
        public float $custos = 0,
        public float $despesas = 0,
        public float $investimento = 0,
        public ?float $meta = null,
    ) {}

    public function saidas(): float
    {
        return $this->custos + $this->despesas + $this->investimento;
    }

    public function resultadoOperacional(): float
    {
        return round($this->vendas - $this->custos - $this->despesas, 2);
    }

    public function saldoCaixa(): float
    {
        return round($this->vendas + $this->outrasEntradas - $this->saidas(), 2);
    }

    public function margem(): ?float
    {
        return $this->vendas > 0 ? $this->resultadoOperacional() / $this->vendas : null;
    }

    public function progressoMeta(): ?float
    {
        return $this->meta ? min(1, $this->vendas / $this->meta) : null;
    }

    public function vendasDoCanal(Canal $canal): float
    {
        return $this->vendasPorCanal[$canal->value] ?? 0;
    }

    public function somar(self $outro): self
    {
        $canais = $this->vendasPorCanal;
        foreach ($outro->vendasPorCanal as $canal => $valor) {
            $canais[$canal] = ($canais[$canal] ?? 0) + $valor;
        }

        return new self(
            vendas: $this->vendas + $outro->vendas,
            qtdVendas: $this->qtdVendas + $outro->qtdVendas,
            vendasPorCanal: $canais,
            outrasEntradas: $this->outrasEntradas + $outro->outrasEntradas,
            custos: $this->custos + $outro->custos,
            despesas: $this->despesas + $outro->despesas,
            investimento: $this->investimento + $outro->investimento,
            meta: ($this->meta || $outro->meta) ? ($this->meta ?? 0) + ($outro->meta ?? 0) : null,
        );
    }

    public function valor(string $coluna): float
    {
        return match ($coluna) {
            'saidas' => $this->saidas(),
            'saldo' => $this->saldoCaixa(),
            'resultado' => $this->resultadoOperacional(),
            'margem' => $this->margem() ?? -INF,
            'qtd' => $this->qtdVendas,
            default => $this->vendas,
        };
    }
}
