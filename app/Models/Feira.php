<?php

namespace App\Models;

use App\Enums\FeiraStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Feira extends Model
{
    protected $attributes = ['status' => 'planejada', 'qtd_barraquinhas' => 0];

    protected $fillable = ['nome', 'data_inicio', 'data_fim', 'data_corte_pre_venda', 'status', 'qtd_barraquinhas'];

    protected function casts(): array
    {
        return [
            'data_inicio' => 'date',
            'data_fim' => 'date',
            'data_corte_pre_venda' => 'datetime',
            'status' => FeiraStatus::class,
            'qtd_barraquinhas' => 'integer',
        ];
    }

    public function barraquinhas(): HasMany
    {
        return $this->hasMany(Barraquinha::class)->orderBy('posicao');
    }

    public function vendas(): HasMany
    {
        return $this->hasMany(Venda::class);
    }

    public function estaEncerrada(): bool
    {
        return $this->status === FeiraStatus::Encerrada;
    }

    /** Sem data de corte (feira anterior à regra), a pré-venda segue aberta. */
    public function preVendaAberta(): bool
    {
        return $this->data_corte_pre_venda === null || now()->lessThanOrEqualTo($this->data_corte_pre_venda);
    }

    public function scopeRecentes(Builder $query): Builder
    {
        return $query->orderByDesc('data_inicio')->orderByDesc('id');
    }

    public static function padrao(): ?self
    {
        return static::where('status', FeiraStatus::Aberta)->recentes()->first()
            ?? static::recentes()->first();
    }
}
