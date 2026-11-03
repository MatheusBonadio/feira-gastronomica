<?php

namespace App\Models;

use App\Enums\Perfil;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    // Mesmos defaults do banco, para o model recém-criado já tê-los em memória.
    protected $attributes = ['ativo' => true, 'trocar_senha' => false];

    protected $fillable = [
        'nome', 'usuario', 'password', 'perfil', 'barraquinha_id',
        'ativo', 'trocar_senha', 'idioma', 'ultimo_acesso_em',
    ];

    protected $hidden = ['password'];

    // Sem "lembrar-me": a sessão expira por inatividade (SESSION_LIFETIME).
    protected $rememberTokenName = '';

    protected function casts(): array
    {
        return [
            'perfil' => Perfil::class,
            'ativo' => 'boolean',
            'trocar_senha' => 'boolean',
            'ultimo_acesso_em' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function barraquinha(): BelongsTo
    {
        return $this->belongsTo(Barraquinha::class);
    }

    public function ehAdmin(): bool
    {
        return $this->perfil === Perfil::Admin;
    }

    public function ehBarraquinha(): bool
    {
        return $this->perfil === Perfil::Barraquinha;
    }

    public function podeEntrar(): bool
    {
        if (! $this->ativo) {
            return false;
        }

        return $this->ehAdmin() || $this->barraquinha?->estaAtiva();
    }
}
