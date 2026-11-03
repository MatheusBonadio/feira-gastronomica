<?php

namespace App\Models;

use App\Enums\Canal;
use App\Enums\TipoDesconto;
use App\Models\Concerns\PertenceABarraquinha;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Combo extends Model
{
    use PertenceABarraquinha;

    protected $attributes = ['ativo' => true];

    protected $fillable = ['barraquinha_id', 'nome', 'numero', 'tipo_desconto', 'valor', 'ativo'];

    protected function casts(): array
    {
        return [
            'numero' => 'integer',
            'tipo_desconto' => TipoDesconto::class,
            'valor' => 'decimal:2',
            'ativo' => 'boolean',
        ];
    }

    public function componentes(): HasMany
    {
        return $this->hasMany(ComboItem::class);
    }

    public function itens(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'combo_itens')->withPivot('quantidade');
    }

    public function linhasVendidas(): HasMany
    {
        return $this->hasMany(VendaLinha::class);
    }

    public function scopeAtivos(Builder $query): Builder
    {
        return $query->where('ativo', true);
    }

    public function tag(): string
    {
        return __('Combo :n', ['n' => $this->numero]);
    }

    /** Item inativado dentro do combo: sinalizado e fora da classificação até ser corrigido. */
    public function estaIncompleto(): bool
    {
        return $this->itens->contains(fn (Item $item) => ! $item->ativo);
    }

    public function aplicavel(): bool
    {
        return $this->ativo && ! $this->estaIncompleto() && $this->itens->isNotEmpty();
    }

    public function somaAvulsa(Canal $canal = Canal::PADRAO): float
    {
        return round($this->itens->sum(fn (Item $item) => $item->precoPara($canal) * $item->pivot->quantidade), 2);
    }

    public function precoPara(Canal $canal = Canal::PADRAO): float
    {
        return self::calcularPreco($this->tipo_desconto, (float) $this->valor, $this->somaAvulsa($canal));
    }

    public static function calcularPreco(TipoDesconto $tipo, float $valor, float $somaAvulsa): float
    {
        return $tipo === TipoDesconto::PrecoFechado
            ? round($valor, 2)
            : round($somaAvulsa * (1 - $valor / 100), 2);
    }

    /** @return array<int, int> item_id => quantidade, ordenado, para comparar composições */
    public function composicao(): array
    {
        $composicao = $this->itens->mapWithKeys(fn (Item $i) => [$i->id => (int) $i->pivot->quantidade])->all();
        ksort($composicao);

        return $composicao;
    }

    public function foiVendido(): bool
    {
        return VendaLinha::where('combo_id', $this->id)->exists();
    }
}
