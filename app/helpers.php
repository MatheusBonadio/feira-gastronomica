<?php

use App\Support\Formato;
use App\Support\Loja;

if (! function_exists('moeda')) {
    function moeda(float|int|string|null $valor): string
    {
        return Formato::moeda($valor);
    }
}

if (! function_exists('numero')) {
    function numero(float|int|string|null $valor, int $casas = 0): string
    {
        return Formato::numero($valor, $casas);
    }
}

if (! function_exists('percentual')) {
    function percentual(?float $valor, int $casas = 1): string
    {
        return Formato::percentual($valor, $casas);
    }
}

if (! function_exists('data_formatada')) {
    function data_formatada(mixed $data, bool $comHora = false): string
    {
        return $comHora ? Formato::dataHora($data) : Formato::data($data);
    }
}

if (! function_exists('loja')) {
    function loja(): Loja
    {
        return app(Loja::class);
    }
}
