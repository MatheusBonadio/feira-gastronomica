<?php

namespace App\Models;

use App\Enums\Canal;
use App\Models\Concerns\PertenceABarraquinha;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemPreco extends Model
{
    use PertenceABarraquinha;

    protected $table = 'item_precos';

    protected $fillable = ['barraquinha_id', 'item_id', 'canal', 'preco'];

    protected function casts(): array
    {
        return [
            'canal' => Canal::class,
            'preco' => 'decimal:2',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
