<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    public const PADRAO = ['Comida', 'Bebida', 'Sobremesa'];

    protected $attributes = ['ativo' => true];

    protected $fillable = ['nome', 'ativo'];

    protected function casts(): array
    {
        return ['ativo' => 'boolean'];
    }

    public function itens(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    public function nomeExibicao(): string
    {
        return in_array($this->nome, self::PADRAO, true) ? __($this->nome) : $this->nome;
    }
}
