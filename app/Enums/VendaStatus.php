<?php

namespace App\Enums;

enum VendaStatus: string
{
    case Concluida = 'concluida';
    case Cancelada = 'cancelada';

    public function label(): string
    {
        return match ($this) {
            self::Concluida => __('Concluída'),
            self::Cancelada => __('Cancelada'),
        };
    }

    public function variante(): string
    {
        return $this === self::Concluida ? 'success' : 'danger';
    }
}
