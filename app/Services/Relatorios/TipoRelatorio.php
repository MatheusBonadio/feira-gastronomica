<?php

namespace App\Services\Relatorios;

enum TipoRelatorio: string
{
    case VendasDetalhadas = 'vendas_detalhadas';
    case ResumoVendas = 'resumo_vendas';
    case EntradasSaidas = 'entradas_saidas';
    case Fechamento = 'fechamento';
    case Comparativo = 'comparativo';

    public function label(): string
    {
        return match ($this) {
            self::VendasDetalhadas => __('Vendas detalhadas'),
            self::ResumoVendas => __('Resumo de vendas'),
            self::EntradasSaidas => __('Entradas e saídas'),
            self::Fechamento => __('Fechamento financeiro'),
            self::Comparativo => __('Comparativo de barraquinhas'),
        };
    }

    public function descricao(): string
    {
        return match ($this) {
            self::VendasDetalhadas => __('Uma linha por venda e item: data, canal, item ou combo, tag, quantidade, preço, desconto, total e pagamento.'),
            self::ResumoVendas => __('Totais por canal, por tag (Comum e cada Combo N) e por item.'),
            self::EntradasSaidas => __('Lançamentos de entrada e de saída com categoria, valor e data.'),
            self::Fechamento => __('Vendas, outras entradas, custos, despesas, investimento, resultado, saldo e margem.'),
            self::Comparativo => __('Uma linha por barraquinha com os principais indicadores.'),
        };
    }

    public function somenteAdmin(): bool
    {
        return $this === self::Comparativo;
    }

    public static function disponiveis(bool $admin): array
    {
        return array_values(array_filter(self::cases(), fn (self $t) => $admin || ! $t->somenteAdmin()));
    }
}
