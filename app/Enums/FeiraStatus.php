<?php

namespace App\Enums;

enum FeiraStatus: string
{
    case Planejada = 'planejada';
    case Aberta = 'aberta';
    case Encerrada = 'encerrada';

    public function label(): string
    {
        return match ($this) {
            self::Planejada => __('Planejada'),
            self::Aberta => __('Aberta'),
            self::Encerrada => __('Encerrada'),
        };
    }

    public function variante(): string
    {
        return match ($this) {
            self::Planejada => 'info',
            self::Aberta => 'success',
            self::Encerrada => 'muted',
        };
    }
}
