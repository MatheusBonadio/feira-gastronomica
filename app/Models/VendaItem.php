<?php

namespace App\Models;

use App\Models\Concerns\PertenceABarraquinha;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendaItem extends Model
{
    use PertenceABarraquinha;

    public $timestamps = false;

    protected $table = 'venda_itens';

    protected $fillable = [
        'barraquinha_id', 'venda_id', 'venda_linha_id', 'item_id', 'item_nome', 'quantidade', 'custo_unitario',
    ];

    protected function casts(): array
    {
        return [
            'quantidade' => 'integer',
            'custo_unitario' => 'decimal:2',
        ];
    }

    public function venda(): BelongsTo
    {
        return $this->belongsTo(Venda::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
