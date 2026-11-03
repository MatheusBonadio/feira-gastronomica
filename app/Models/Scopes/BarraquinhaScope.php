<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Para o perfil Barraquinha, toda consulta é filtrada pelo id da barraquinha
 * da sessão, nunca por parâmetro vindo da tela. O admin não é filtrado aqui:
 * as telas do admin filtram explicitamente pela barraquinha escolhida.
 */
class BarraquinhaScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = auth()->user();

        if ($user?->ehBarraquinha()) {
            $builder->where($model->qualifyColumn('barraquinha_id'), $user->barraquinha_id);
        }
    }
}
