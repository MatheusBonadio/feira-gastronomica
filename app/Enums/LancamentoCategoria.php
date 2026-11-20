<?php

namespace App\Enums;

enum LancamentoCategoria: string
{
    case Patrocinio = 'patrocinio';
    case Rifa = 'rifa';
    case AporteSocios = 'aporte_socios';
    case OutraEntrada = 'outra_entrada';

    case Mercadoria = 'mercadoria';
    case Insumos = 'insumos';

    case Embalagem = 'embalagem';
    case Aluguel = 'aluguel';
    case Taxas = 'taxas';
    case TaxaCartao = 'taxa_cartao';
    case OutraDespesa = 'outra_despesa';

    case Investimento = 'investimento';

    public const GRUPO_ENTRADA = 'entrada';
    public const GRUPO_CUSTO = 'custo';
    public const GRUPO_DESPESA = 'despesa';
    public const GRUPO_INVESTIMENTO = 'investimento';

    public function tipo(): LancamentoTipo
    {
        return $this->grupo() === self::GRUPO_ENTRADA ? LancamentoTipo::Entrada : LancamentoTipo::Saida;
    }

    public function grupo(): string
    {
        return match ($this) {
            self::Patrocinio, self::Rifa, self::AporteSocios, self::OutraEntrada => self::GRUPO_ENTRADA,
            self::Mercadoria, self::Insumos => self::GRUPO_CUSTO,
            self::Embalagem, self::Aluguel, self::Taxas, self::TaxaCartao, self::OutraDespesa => self::GRUPO_DESPESA,
            self::Investimento => self::GRUPO_INVESTIMENTO,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Patrocinio => __('Patrocínio'),
            self::Rifa => __('Rifa'),
            self::AporteSocios => __('Aporte de sócios'),
            self::OutraEntrada => __('Outra entrada'),
            self::Mercadoria => __('Mercadoria'),
            self::Insumos => __('Insumos'),
            self::Embalagem => __('Embalagem'),
            self::Aluguel => __('Aluguel'),
            self::Taxas => __('Taxas'),
            self::TaxaCartao => __('Taxa de cartão'),
            self::OutraDespesa => __('Outra despesa'),
            self::Investimento => __('Investimento'),
        };
    }

    public static function grupoLabel(string $grupo): string
    {
        return match ($grupo) {
            self::GRUPO_ENTRADA => __('Outras entradas'),
            self::GRUPO_CUSTO => __('Custos'),
            self::GRUPO_DESPESA => __('Despesas'),
            self::GRUPO_INVESTIMENTO => __('Investimento'),
        };
    }

    public static function porTipo(): array
    {
        $grupos = [];
        foreach (self::cases() as $categoria) {
            $grupos[$categoria->tipo()->value][] = $categoria;
        }

        return $grupos;
    }

    public static function valoresDoGrupo(string $grupo): array
    {
        return array_values(array_map(
            fn (self $c) => $c->value,
            array_filter(self::cases(), fn (self $c) => $c->grupo() === $grupo),
        ));
    }
}
