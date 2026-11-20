<?php

namespace App\Models;

use App\Enums\FeiraStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Feira extends Model
{
    protected $attributes = ['status' => 'planejada', 'qtd_barraquinhas' => 0];

    protected $fillable = ['nome', 'data_inicio', 'data_fim', 'status', 'qtd_barraquinhas'];

    protected function casts(): array
    {
        return [
            'data_inicio' => 'date',
            'data_fim' => 'date',
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
