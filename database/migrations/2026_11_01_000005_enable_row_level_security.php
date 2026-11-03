<?php

use App\Support\Rls\RlsMysql;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Isolamento entre barraquinhas garantido pelo banco (MySQL/MariaDB).
 * Detalhes em App\Support\Rls\RlsMysql. Em outros bancos (SQLite dos testes)
 * vale só a camada da aplicação.
 *
 * Com RLS instalado, recrie o banco com "migrate:fresh --drop-views".
 */
return new class extends Migration
{
    public function up(): void
    {
        if ($this->aplicavel()) {
            (new RlsMysql(DB::connection()))->instalar();
        }
    }

    public function down(): void
    {
        if ($this->aplicavel()) {
            (new RlsMysql(DB::connection()))->remover();
        }
    }

    private function aplicavel(): bool
    {
        return config('feira.rls') && RlsMysql::suportado(DB::connection());
    }
};
