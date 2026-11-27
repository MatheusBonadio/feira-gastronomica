<?php

namespace App\Models;

use App\Enums\Canal;
use App\Enums\TipoDesconto;
use App\Models\Concerns\PertenceABarraquinha;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Regra de desconto de um combo num canal; sem regra, o combo não vale naquele canal. */
class ComboCanal extends Model
{
    use PertenceABarraquinha;

    public $timestamps = false;

    protected $table = 'combo_canais';

    protected $fillable = ['barraquinha_id', 'combo_id', 'canal', 'tipo_desconto', 'valor'];

    protected function casts(): array
    {
        return [
            'canal' => Canal::class,
            'tipo_desconto' => TipoDesconto::class,
            'valor' => 'decimal:2',
        ];
    }

    public function combo(): BelongsTo
    {
        return $this->belongsTo(Combo::class);
    }
}
