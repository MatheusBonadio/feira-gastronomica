<?php

namespace App\Models;

use App\Models\Concerns\PertenceABarraquinha;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendaLinha extends Model
{
    use PertenceABarraquinha;

    public const TAG_COMUM = 'comum';
    public const TAG_COMBO = 'combo';

    public $timestamps = false;

    protected $table = 'venda_linhas';

    protected $fillable = [
        'barraquinha_id', 'venda_id', 'item_id', 'combo_id', 'descricao', 'tag', 'combo_numero',
        'quantidade', 'preco_unitario', 'desconto', 'total',
    ];

    protected function casts(): array
    {
        return [
            'quantidade' => 'integer',
            'combo_numero' => 'integer',
            'preco_unitario' => 'decimal:2',
            'desconto' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function venda(): BelongsTo
    {
        return $this->belongsTo(Venda::class);
    }

    public function itens(): HasMany
    {
        return $this->hasMany(VendaItem::class);
    }

    public function tagLabel(): string
    {
        return self::rotuloTag($this->tag, $this->combo_numero);
    }

    public static function rotuloTag(string $tag, ?int $numero): string
    {
        return $tag === self::TAG_COMUM ? __('Comum') : __('Combo :n', ['n' => $numero]);
    }
}
