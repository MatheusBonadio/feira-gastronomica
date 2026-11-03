<?php

namespace App\Support\Rls;

use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;

/**
 * Row Level Security para MySQL/MariaDB, que não têm RLS nativo.
 *
 * Cada tabela protegida é renomeada para "<tabela>_base" e ganha uma view
 * atualizável com o nome original, filtrada pelo contexto da sessão:
 *
 *   @app_perfil          admin | barraquinha | sistema | anonimo
 *   @app_barraquinha_id  barraquinha logada
 *   @app_feira_id        feira dessa barraquinha
 *
 * O Eloquent continua usando os nomes originais (as views). WITH CHECK OPTION
 * impede gravar linha de outra barraquinha; triggers nas tabelas base cuidam
 * do que a view não cobre (escrita só do admin, trilha de auditoria imutável).
 *
 * A garantia vale contra qualquer consulta da aplicação, inclusive as que
 * esquecem o escopo global. Para valer também contra SQL arbitrário, o usuário
 * de banco da aplicação deve ter permissão só nas views (ver README).
 */
class RlsMysql
{
    public const SUFIXO = '_base';

    /** Tabelas com barraquinha_id: a barraquinha vê e grava só as próprias linhas. */
    public const TABELAS_DA_BARRAQUINHA = [
        'itens', 'item_precos', 'combos', 'combo_itens',
        'vendas', 'venda_linhas', 'venda_itens', 'lancamentos',
    ];

    public const TABELAS_ADMIN = ['feiras', 'barraquinhas'];

    public const AUDITORIA = 'auditoria_logs';

    public function __construct(private readonly ?Connection $connection = null) {}

    public static function suportado(Connection $connection): bool
    {
        return in_array($connection->getDriverName(), ['mysql', 'mariadb'], true);
    }

    public function instalar(): void
    {
        $this->criarFuncoes();

        foreach ($this->todas() as $tabela) {
            if (! $this->protegida($tabela)) {
                $this->db()->statement("RENAME TABLE `{$tabela}` TO `{$tabela}".self::SUFIXO.'`');
            }
        }

        $this->criarViews();
        $this->criarTriggers();
    }

    /** Recria só as views, por exemplo depois de uma migration que adicionou coluna na tabela base. */
    public function criarViews(): void
    {
        foreach (self::TABELAS_DA_BARRAQUINHA as $tabela) {
            $this->view($tabela, 'fg_pode_acessar(`barraquinha_id`)', true);
        }

        $this->view('barraquinhas', 'fg_privilegiado() OR `id` = fg_barraquinha_atual()', true);
        $this->view('feiras', 'fg_privilegiado() OR `id` = fg_feira_atual()', true);

        // Sem CHECK OPTION: qualquer perfil grava a própria trilha, só o admin lê.
        $this->view(self::AUDITORIA, 'fg_privilegiado()', false);
    }

    public function remover(): void
    {
        foreach ($this->todas() as $tabela) {
            foreach (['bi', 'bu', 'bd'] as $evento) {
                $this->db()->statement("DROP TRIGGER IF EXISTS `{$tabela}_rls_{$evento}`");
            }
            if ($this->protegida($tabela)) {
                $this->db()->statement("DROP VIEW IF EXISTS `{$tabela}`");
                $this->db()->statement("RENAME TABLE `{$tabela}".self::SUFIXO."` TO `{$tabela}`");
            }
        }

        foreach (['fg_pode_acessar', 'fg_feira_atual', 'fg_barraquinha_atual', 'fg_privilegiado'] as $funcao) {
            $this->db()->statement("DROP FUNCTION IF EXISTS {$funcao}");
        }
    }

    public function protegida(string $tabela): bool
    {
        return (bool) $this->db()->selectOne(
            'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
            [$tabela.self::SUFIXO],
        );
    }

    /** @return list<string> */
    private function todas(): array
    {
        return [...self::TABELAS_DA_BARRAQUINHA, ...self::TABELAS_ADMIN, self::AUDITORIA];
    }

    private function criarFuncoes(): void
    {
        // NO SQL: só leem variáveis da sessão (aceito com binlog ligado).
        $funcoes = [
            'fg_privilegiado' => "() RETURNS TINYINT(1) NOT DETERMINISTIC NO SQL
                RETURN COALESCE(@app_perfil, '') IN ('admin', 'sistema')",
            'fg_barraquinha_atual' => "() RETURNS BIGINT UNSIGNED NOT DETERMINISTIC NO SQL
                RETURN IF(@app_perfil = 'barraquinha', @app_barraquinha_id, NULL)",
            'fg_feira_atual' => "() RETURNS BIGINT UNSIGNED NOT DETERMINISTIC NO SQL
                RETURN IF(@app_perfil = 'barraquinha', @app_feira_id, NULL)",
            'fg_pode_acessar' => '(alvo BIGINT UNSIGNED) RETURNS TINYINT(1) NOT DETERMINISTIC NO SQL
                RETURN fg_privilegiado() OR alvo = fg_barraquinha_atual()',
        ];

        foreach ($funcoes as $nome => $corpo) {
            $this->db()->statement("DROP FUNCTION IF EXISTS {$nome}");
            $this->db()->unprepared("CREATE FUNCTION {$nome}{$corpo}");
        }
    }

    private function view(string $tabela, string $condicao, bool $checar): void
    {
        $base = $tabela.self::SUFIXO;
        $check = $checar ? ' WITH CASCADED CHECK OPTION' : '';

        $this->db()->unprepared(
            "CREATE OR REPLACE ALGORITHM = MERGE SQL SECURITY DEFINER VIEW `{$tabela}` AS SELECT * FROM `{$base}` WHERE {$condicao}{$check}"
        );
    }

    private function criarTriggers(): void
    {
        $negar = fn (string $mensagem) => "SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '{$mensagem}'";

        // Feiras e barraquinhas: a barraquinha lê a própria linha, mas só o admin grava.
        foreach (self::TABELAS_ADMIN as $tabela) {
            foreach (['bi' => 'INSERT', 'bu' => 'UPDATE', 'bd' => 'DELETE'] as $sufixo => $evento) {
                $this->trigger($tabela, $sufixo, $evento, 'IF NOT fg_privilegiado() THEN '.$negar("RLS: escrita em {$tabela} restrita ao admin").'; END IF;');
            }
        }

        // Auditoria: grava só em nome da própria barraquinha; ninguém altera nem apaga pelo app.
        $this->trigger(self::AUDITORIA, 'bi', 'INSERT',
            'IF NEW.barraquinha_id IS NOT NULL AND NOT fg_pode_acessar(NEW.barraquinha_id) THEN '.$negar('RLS: auditoria de outra barraquinha').'; END IF;');
        foreach (['bu' => 'UPDATE', 'bd' => 'DELETE'] as $sufixo => $evento) {
            $this->trigger(self::AUDITORIA, $sufixo, $evento,
                "IF COALESCE(@app_perfil, '') <> 'sistema' THEN ".$negar('RLS: auditoria imutavel').'; END IF;');
        }
    }

    private function trigger(string $tabela, string $sufixo, string $evento, string $corpo): void
    {
        $nome = "{$tabela}_rls_{$sufixo}";
        $this->db()->statement("DROP TRIGGER IF EXISTS `{$nome}`");
        $this->db()->unprepared(
            "CREATE TRIGGER `{$nome}` BEFORE {$evento} ON `{$tabela}".self::SUFIXO."` FOR EACH ROW BEGIN {$corpo} END"
        );
    }

    private function db(): Connection
    {
        return $this->connection ?? DB::connection();
    }
}
