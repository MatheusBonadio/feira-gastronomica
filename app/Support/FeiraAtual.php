<?php

namespace App\Support;

use App\Models\Feira;

/** Feira em que o admin está trabalhando: escolhida no seletor (sessão) ou a padrão. */
class FeiraAtual
{
    private const CHAVE = 'admin.feira_id';

    public static function obter(): ?Feira
    {
        $id = session(self::CHAVE);

        return ($id ? Feira::find($id) : null) ?? Feira::padrao();
    }

    public static function definir(Feira $feira): void
    {
        session([self::CHAVE => $feira->id]);
    }
}
