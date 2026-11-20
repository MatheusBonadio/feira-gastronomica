<?php

namespace App\Models;

use App\Enums\Canal;
use App\Enums\FormaPagamento;
use App\Enums\VendaStatus;
use App\Models\Concerns\PertenceABarraquinha;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Venda extends Model
{
    use PertenceABarraquinha;

    protected $fillable = [
        'barraquinha_id', 'feira_id', 'operador_id', 'numero', 'data_hora', 'canal', 'pagamento',
        'subtotal', 'desconto', 'total', 'status', 'motivo_cancelamento', 'cancelada_por', 'cancelada_em',
    ];

    protected function casts(): array
    {
        return [
            'data_hora' => 'datetime',
            'cancelada_em' => 'datetime',
            'canal' => Canal::class,
            'pagamento' => FormaPagamento::class,
            'status' => VendaStatus::class,
            'subtotal' => 'decimal:2',
            'desconto' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function feira(): BelongsTo
    {
        return $this->belongsTo(Feira::class);
    }

    public function operador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operador_id');
    }

    public function canceladaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelada_por');
    }

    public function linhas(): HasMany
    {
        return $this->hasMany(VendaLinha::class);
    }

    public function scopeConcluidas(Builder $query): Builder
    {
        return $query->where($query->qualifyColumn('status'), VendaStatus::Concluida->value);
    }

    public function estaCancelada(): bool
    {
        return $this->status === VendaStatus::Cancelada;
    }

    public function resumo(): string
    {
        return $this->linhas
            ->groupBy(fn (VendaLinha $l) => $l->tag === VendaLinha::TAG_COMUM ? 0 : $l->combo_numero)
            ->sortKeys()
            ->sortBy(fn ($linhas, $numero) => $numero === 0 ? PHP_INT_MAX : $numero)
            ->map(function ($linhas, $numero) {
                if ($numero === 0) {
                    return __('Comum');
                }
                $qtd = $linhas->sum('quantidade');

                return __('Combo :n', ['n' => $numero]).($qtd > 1 ? " × {$qtd}" : '');
            })
            ->implode(' + ');
    }
}
