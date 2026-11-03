<?php

namespace App\Enums;

enum LancamentoTipo: string
{
    case Entrada = 'entrada';
    case Saida = 'saida';

    public function label(): string
    {
        return match ($this) {
            self::Entrada => __('Entrada'),
            self::Saida => __('Saída'),
        };
    }
}
