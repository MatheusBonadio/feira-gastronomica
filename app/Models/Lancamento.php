<?php

namespace App\Models;

use App\Enums\LancamentoCategoria;
use App\Enums\LancamentoTipo;
use App\Models\Concerns\PertenceABarraquinha;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lancamento extends Model
{
    use PertenceABarraquinha, SoftDeletes;

    protected $fillable = [
        'barraquinha_id', 'tipo', 'categoria', 'descricao', 'valor', 'data', 'comprovante_path', 'criado_por',
    ];

    protected function casts(): array
    {
        return [
            'tipo' => LancamentoTipo::class,
            'categoria' => LancamentoCategoria::class,
            'valor' => 'decimal:2',
            'data' => 'date',
        ];
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criado_por');
    }
}
