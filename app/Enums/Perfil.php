<?php

namespace App\Enums;

enum Perfil: string
{
    case Admin = 'admin';
    case Barraquinha = 'barraquinha';

    public function label(): string
    {
        return match ($this) {
            self::Admin => __('Administrador'),
            self::Barraquinha => __('Barraquinha'),
        };
    }

    public function homeRoute(): string
    {
        return match ($this) {
            self::Admin => 'admin.painel',
            self::Barraquinha => 'barraquinha.painel',
        };
    }
}
