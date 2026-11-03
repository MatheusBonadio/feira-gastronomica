<?php

namespace App\Enums;

enum TipoDesconto: string
{
    case PrecoFechado = 'preco_fechado';
    case Percentual = 'percentual';

    public function label(): string
    {
        return match ($this) {
            self::PrecoFechado => __('Preço fechado'),
            self::Percentual => __('Percentual de desconto'),
        };
    }
}
