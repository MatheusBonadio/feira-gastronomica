<?php

namespace App\Models;

use App\Models\Concerns\PertenceABarraquinha;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComboItem extends Model
{
    use PertenceABarraquinha;

    public $timestamps = false;

    protected $table = 'combo_itens';

    protected $fillable = ['barraquinha_id', 'combo_id', 'item_id', 'quantidade'];

    public function combo(): BelongsTo
    {
        return $this->belongsTo(Combo::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
