<?php

namespace App\Models;

use App\Enums\Canal;
use App\Models\Concerns\PertenceABarraquinha;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Item extends Model
{
    use PertenceABarraquinha;

    protected $table = 'itens';

    protected $attributes = ['ativo' => true];

    protected $fillable = [
        'barraquinha_id', 'categoria_id', 'nome', 'descricao', 'custo', 'estoque_inicial', 'ativo',
    ];

    protected function casts(): array
    {
        return [
            'custo' => 'decimal:2',
            'estoque_inicial' => 'integer',
            'ativo' => 'boolean',
        ];
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function precos(): HasMany
    {
        return $this->hasMany(ItemPreco::class);
    }

    public function vendaItens(): HasMany
    {
        return $this->hasMany(VendaItem::class);
    }

    public function scopeAtivos(Builder $query): Builder
    {
        return $query->where('ativo', true);
    }

    /** Preço do canal; sem preço próprio, vale o preço de Feira (padrão). */
    public function precoPara(Canal $canal): float
    {
        $precos = $this->precos->keyBy(fn (ItemPreco $p) => $p->canal->value);

        return (float) ($precos->get($canal->value)?->preco ?? $precos->get(Canal::PADRAO->value)?->preco ?? 0);
    }

    public function foiVendido(): bool
    {
        return $this->vendaItens()->exists() || VendaLinha::where('item_id', $this->id)->exists();
    }

    /** Estoque restante calculado (não armazenado); null quando o item não controla estoque. */
    public function estoqueRestante(?int $vendidos = null): ?int
    {
        if ($this->estoque_inicial === null) {
            return null;
        }

        $vendidos ??= (int) VendaItem::query()
            ->where('item_id', $this->id)
            ->whereHas('venda', fn ($q) => $q->concluidas())
            ->sum('quantidade');

        return $this->estoque_inicial - $vendidos;
    }
}
