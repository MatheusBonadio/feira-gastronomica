<?php

namespace App\Enums;

enum FormaPagamento: string
{
    case Dinheiro = 'dinheiro';
    case Pix = 'pix';
    case Cartao = 'cartao';

    public function label(): string
    {
        return match ($this) {
            self::Dinheiro => __('Dinheiro'),
            self::Pix => __('Pix'),
            self::Cartao => __('Cartão'),
        };
    }

    public function icone(): string
    {
        return match ($this) {
            self::Dinheiro => 'banknote',
            self::Pix => 'qr-code',
            self::Cartao => 'credit-card',
        };
    }
}
