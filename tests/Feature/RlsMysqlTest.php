<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\ContextoRls;
use App\Support\Rls\RlsMysql;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Row Level Security no banco (MySQL/MariaDB). Ignorado no SQLite. Rode com:
 *   DB_CONNECTION=mysql DB_DATABASE=feira_gastronomica_testes php artisan test --filter=RlsMysql
 *
 * As consultas aqui são SQL cru, sem o escopo global do Eloquent: provam que o
 * isolamento vale mesmo se a aplicação esquecer o filtro.
 */
class RlsMysqlTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! RlsMysql::suportado(DB::connection())) {
            $this->markTestSkipped('RLS só existe no MySQL/MariaDB.');
        }
    }

    protected function tearDown(): void
    {
        app(ContextoRls::class)->definirSistema();
        parent::tearDown();
    }

    private function como(?User $user): void
    {
        app(ContextoRls::class)->definirPara($user);
    }

    public function test_sql_cru_so_enxerga_as_linhas_da_propria_barraquinha(): void
    {
        $feira = $this->criarFeira();
        $a = $this->criarBarraquinha($feira, 'A');
        $b = $this->criarBarraquinha($feira, 'B');
        $this->criarItem($a, 'Item A', 10);
        $this->criarItem($b, 'Item B', 10);
        $userA = $this->usuarioDa($a);

        $this->como($userA);

        $this->assertSame(['Item A'], DB::table('itens')->pluck('nome')->all());
        $this->assertSame(['A'], DB::table('barraquinhas')->pluck('nome')->all());
        $this->assertSame(0, DB::table('itens')->where('barraquinha_id', $b->id)->update(['nome' => 'invadido']));
        $this->assertSame(0, DB::table('itens')->where('barraquinha_id', $b->id)->delete());
        $this->assertSame(0, DB::table('auditoria_logs')->count());
    }

    public function test_nao_grava_linha_em_nome_de_outra_barraquinha(): void
    {
        $feira = $this->criarFeira();
        $a = $this->criarBarraquinha($feira, 'A');
        $b = $this->criarBarraquinha($feira, 'B');
        $categoria = \App\Models\Categoria::firstOrCreate(['nome' => 'Comida']);

        $this->como($this->usuarioDa($a));

        $this->expectException(QueryException::class);
        DB::table('itens')->insert(['barraquinha_id' => $b->id, 'categoria_id' => $categoria->id, 'nome' => 'Intruso', 'ativo' => true]);
    }

    public function test_barraquinha_nao_altera_feiras_nem_barraquinhas(): void
    {
        $a = $this->criarBarraquinha();
        $this->como($this->usuarioDa($a));

        $this->expectException(QueryException::class);
        DB::table('barraquinhas')->where('id', $a->id)->update(['status' => 'ativa', 'meta_vendas' => 1]);
    }

    public function test_anonimo_nao_ve_nada_e_admin_ve_tudo(): void
    {
        $feira = $this->criarFeira();
        $this->criarItem($this->criarBarraquinha($feira, 'A'), 'Item A', 10);
        $this->criarItem($this->criarBarraquinha($feira, 'B'), 'Item B', 10);

        $this->como(null);
        $this->assertSame(0, DB::table('itens')->count());

        $this->como($this->criarAdminSemContexto());
        $this->assertSame(2, DB::table('itens')->count());
    }

    public function test_trilha_de_auditoria_e_imutavel(): void
    {
        DB::table('auditoria_logs')->insert(['acao' => 'login', 'created_at' => now()]);
        $this->como($this->criarAdminSemContexto());

        $this->expectException(QueryException::class);
        DB::table('auditoria_logs')->delete();
    }

    /** Cria o admin no contexto de sistema e devolve o model. */
    private function criarAdminSemContexto(): User
    {
        app(ContextoRls::class)->definirSistema();

        return $this->criarAdmin();
    }
}
