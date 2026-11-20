<?php

namespace App\Models;

use App\Enums\BarraquinhaStatus;
use App\Services\FotoService;
use App\Support\PreferenciasCheckout;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Barraquinha extends Model
{
    protected $attributes = ['status' => 'ativa'];

    protected $fillable = ['feira_id', 'posicao', 'nome', 'responsaveis', 'status', 'meta_vendas'];

    protected function casts(): array
    {
        return [
            'status' => BarraquinhaStatus::class,
            'meta_vendas' => 'decimal:2',
            'posicao' => 'integer',
            'checkout' => 'array',
        ];
    }

    public function fotoUrl(): ?string
    {
        return FotoService::url($this->foto_path);
    }

    /** Como o PDV desta barraquinha funciona (escolhido pelo gestor dela). */
    public function preferenciasCheckout(): PreferenciasCheckout
    {
        return PreferenciasCheckout::de($this->checkout);
    }

    public function feira(): BelongsTo
    {
        return $this->belongsTo(Feira::class);
    }

    public function usuario(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function itens(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    public function combos(): HasMany
    {
        return $this->hasMany(Combo::class);
    }

    public function vendas(): HasMany
    {
        return $this->hasMany(Venda::class);
    }

    public function lancamentos(): HasMany
    {
        return $this->hasMany(Lancamento::class);
    }

    /** Vaga criada pela quantidade da feira e ainda não preenchida pelo admin. */
    public function ehVaga(): bool
    {
        return blank($this->nome);
    }

    public function estaAtiva(): bool
    {
        return $this->status === BarraquinhaStatus::Ativa;
    }

    public function nomeExibicao(): string
    {
        return $this->nome ?: __('Vaga :n', ['n' => $this->posicao]);
    }
}
