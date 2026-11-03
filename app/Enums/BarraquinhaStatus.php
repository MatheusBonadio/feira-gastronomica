<?php

namespace App\Enums;

enum BarraquinhaStatus: string
{
    case Ativa = 'ativa';
    case Bloqueada = 'bloqueada';

    public function label(): string
    {
        return match ($this) {
            self::Ativa => __('Ativa'),
            self::Bloqueada => __('Bloqueada'),
        };
    }

    public function variante(): string
    {
        return $this === self::Ativa ? 'success' : 'danger';
    }
}
