<?php

use App\Support\Rls\RlsMysql;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/*
 * Gera o SQL de permissões do usuário de banco da aplicação em produção:
 * acesso às views e tabelas comuns, nenhum às tabelas *_base. Assim o RLS
 * vale até contra SQL arbitrário. As migrations rodam com outro usuário.
 */
Artisan::command('feira:rls-permissoes {usuario} {host=localhost}', function (string $usuario, string $host) {
    $banco = DB::getDatabaseName();
    $tabelas = collect(DB::select('SELECT table_name AS nome FROM information_schema.tables WHERE table_schema = DATABASE()'))
        ->pluck('nome')
        ->reject(fn ($nome) => str_ends_with($nome, RlsMysql::SUFIXO) || $nome === 'migrations')
        ->sort();

    $this->line("-- Usuário da aplicação: sem acesso às tabelas *".RlsMysql::SUFIXO);
    $this->line("REVOKE ALL PRIVILEGES, GRANT OPTION FROM '{$usuario}'@'{$host}';");
    foreach ($tabelas as $tabela) {
        $this->line("GRANT SELECT, INSERT, UPDATE, DELETE ON `{$banco}`.`{$tabela}` TO '{$usuario}'@'{$host}';");
    }
})->purpose('Imprime os GRANTs do usuário de banco da aplicação (RLS em produção)');
