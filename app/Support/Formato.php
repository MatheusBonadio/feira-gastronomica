<?php

namespace App\Support;

use DateTimeInterface;
use Illuminate\Support\Carbon;

class Formato
{
    public static function numero(float|int|string|null $valor, int $casas = 2): string
    {
        return number_format((float) $valor, $casas, __('formato.decimal'), __('formato.milhar'));
    }

    public static function moeda(float|int|string|null $valor): string
    {
        $valor = (float) $valor;
        $texto = __('formato.moeda', ['valor' => self::numero(abs($valor))]);

        return $valor < 0 ? '-'.$texto : $texto;
    }

    public static function percentual(?float $valor, int $casas = 1): string
    {
        return $valor === null ? '-' : self::numero($valor * 100, $casas).'%';
    }

    public static function data(DateTimeInterface|string|null $data): string
    {
        return $data ? Carbon::parse($data)->format(__('formato.data')) : '-';
    }

    public static function dataHora(DateTimeInterface|string|null $data): string
    {
        return $data ? Carbon::parse($data)->format(__('formato.data_hora')) : '-';
    }

    public static function lerDecimal(mixed $valor): ?float
    {
        if ($valor === null || $valor === '') {
            return null;
        }
        if (is_numeric($valor)) {
            return (float) $valor;
        }

        $texto = preg_replace('/[^\d,.\-]/', '', (string) $valor);
        $decimal = __('formato.decimal');
        $texto = str_replace($decimal === ',' ? '.' : ',', '', $texto);

        return is_numeric($texto = str_replace(',', '.', $texto)) ? (float) $texto : null;
    }
}
