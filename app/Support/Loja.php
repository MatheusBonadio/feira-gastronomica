<?php

namespace App\Support;

use App\Models\Barraquinha;
use Illuminate\Support\Facades\Route;

class Loja
{
    private ?Barraquinha $foco = null;

    public function focar(Barraquinha $barraquinha): void
    {
        $this->foco = $barraquinha;
    }

    public function temFoco(): bool
    {
        return (bool) auth()->user()?->ehBarraquinha() || $this->foco !== null;
    }

    public function barraquinha(): Barraquinha
    {
        $user = auth()->user();

        if ($user?->ehBarraquinha()) {
            return $user->barraquinha;
        }

        abort_unless($this->foco, 404);

        return $this->foco;
    }

    public function ehAdmin(): bool
    {
        return (bool) auth()->user()?->ehAdmin();
    }

    public function nomeRota(string $nome): string
    {
        return ($this->ehAdmin() ? 'admin.loja.' : 'barraquinha.').$nome;
    }

    public function rota(string $nome, mixed $parametros = []): string
    {
        $parametros = is_array($parametros) ? $parametros : [$parametros];

        if ($this->ehAdmin()) {
            $parametros = ['barraquinha' => $this->barraquinha()->id, ...$parametros];
        }

        return route($this->nomeRota($nome), $parametros);
    }

    public function rotaAtiva(string $prefixo): bool
    {
        return str_starts_with(Route::currentRouteName() ?? '', $this->nomeRota($prefixo));
    }
}
