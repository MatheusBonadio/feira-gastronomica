<?php

namespace App\Support;

use App\Models\User;
use App\Support\Rls\RlsMysql;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;

/**
 * Contexto de Row Level Security da requisição (ver App\Support\Rls\RlsMysql).
 *
 * Gravado em variáveis de sessão do MySQL. O PHP abre uma conexão por
 * requisição e a fecha no final, e o contexto é regravado no início de toda
 * requisição, inclusive anônima, então nada vaza de uma requisição para outra.
 * Também é aplicado em toda conexão nova, para valer mesmo se ela abrir depois.
 */
class ContextoRls
{
    public const ADMIN = 'admin';
    public const BARRAQUINHA = 'barraquinha';
    public const SISTEMA = 'sistema';
    public const ANONIMO = 'anonimo';

    private string $perfil = self::ANONIMO;
    private ?int $barraquinhaId = null;
    private ?int $feiraId = null;

    public function definirPara(?User $user): void
    {
        $this->perfil = match (true) {
            $user === null => self::ANONIMO,
            $user->ehAdmin() => self::ADMIN,
            default => self::BARRAQUINHA,
        };
        $this->barraquinhaId = $user?->ehBarraquinha() ? $user->barraquinha_id : null;
        $this->feiraId = null;
        $this->aplicarNasConexoesAbertas();

        // A linha da barraquinha só fica visível depois que o perfil está gravado.
        if ($this->barraquinhaId) {
            $this->feiraId = $user->barraquinha()->value('feira_id');
            $this->aplicarNasConexoesAbertas();
        }
    }

    /** Console, seeders e testes: acesso total, como o dono do banco. */
    public function definirSistema(): void
    {
        $this->perfil = self::SISTEMA;
        $this->barraquinhaId = null;
        $this->feiraId = null;

        $this->aplicarNasConexoesAbertas();
    }

    public function perfil(): string
    {
        return $this->perfil;
    }

    public function aplicar(Connection $connection): void
    {
        if (! config('feira.rls') || ! RlsMysql::suportado($connection)) {
            return;
        }

        $connection->statement(
            'SET @app_perfil = ?, @app_barraquinha_id = ?, @app_feira_id = ?',
            [$this->perfil, $this->barraquinhaId, $this->feiraId],
        );
    }

    private function aplicarNasConexoesAbertas(): void
    {
        foreach (DB::getConnections() as $connection) {
            if ($connection->getRawPdo() !== null) {
                $this->aplicar($connection);
            }
        }
    }
}
