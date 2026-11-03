<?php

namespace App\Models\Concerns;

use App\Enums\AcaoAuditoria;
use App\Models\AuditoriaLog;
use App\Models\Barraquinha;
use App\Models\Scopes\BarraquinhaScope;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait PertenceABarraquinha
{
    protected static function bootPertenceABarraquinha(): void
    {
        static::addGlobalScope(new BarraquinhaScope);

        static::creating(function ($model) {
            $user = auth()->user();
            if ($user?->ehBarraquinha()) {
                $model->barraquinha_id = $user->barraquinha_id;
            }
        });
    }

    public function barraquinha(): BelongsTo
    {
        return $this->belongsTo(Barraquinha::class);
    }

    /**
     * Link ou id alterado apontando para dado de outra barraquinha: acesso negado
     * e auditoria, em vez de um 404 que confirmaria a existência do registro.
     * Com RLS ativo o registro alheio nem é encontrado, e a resposta é a mesma.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $model = static::withoutGlobalScope(BarraquinhaScope::class)
            ->where($field ?? $this->getRouteKeyName(), $value)
            ->first();

        $user = auth()->user();

        if ($user?->ehBarraquinha() && (! $model || (int) $model->barraquinha_id !== (int) $user->barraquinha_id)) {
            AuditoriaLog::registrar(AcaoAuditoria::AcessoNegado, $this, (int) $value, [
                'rota' => request()->path(),
                'dono' => $model?->barraquinha_id,
            ]);

            abort(403);
        }

        if (! $model) {
            throw (new ModelNotFoundException)->setModel(static::class, [$value]);
        }

        return $model;
    }
}
