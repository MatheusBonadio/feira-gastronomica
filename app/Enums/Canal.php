<?php

namespace App\Enums;

enum Canal: string
{
    case PreVenda = 'pre_venda';
    case Feira = 'feira';
    case PosEvento = 'pos_evento';

    public const PADRAO = self::Feira;

    public function label(): string
    {
        return match ($this) {
            self::PreVenda => __('Pré-venda'),
            self::Feira => __('Feira'),
            self::PosEvento => __('Pós-evento'),
        };
    }
}
