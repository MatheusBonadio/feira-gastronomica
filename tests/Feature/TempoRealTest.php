<?php

namespace Tests\Feature;

use App\Models\Lancamento;
use App\Models\User;
use Tests\TestCase;

class TempoRealTest extends TestCase
{
    private function como(User $user): static
    {
        return $this->flushSession()->actingAs($user);
    }

    private function pulso(User $user, string $rota, array $parametros = []): string
    {
        return $this->como($user)->getJson(route($rota, $parametros))->assertOk()->json('versao');
    }

    private function vender(User $user, int $itemId): void
    {
        $this->como($user)->post(route('barraquinha.vendas.store'), ['canal' => 'feira', 'pagamento' => 'pix', 'itens' => [$itemId => 1]])->assertRedirect();
    }

    public function test_pulso_muda_com_venda_cancelamento_e_lancamento(): void
    {
        [$barraquinha, $pastel] = $this->cenarioPastelaria();
        $user = $this->usuarioDa($barraquinha);

        $v1 = $this->pulso($user, 'barraquinha.pulso');
        $this->assertSame($v1, $this->pulso($user, 'barraquinha.pulso'), 'Sem movimento, a versão é estável.');

        $this->vender($user, $pastel->id);
        $v2 = $this->pulso($user, 'barraquinha.pulso');
        $this->assertNotSame($v1, $v2);

        $lancamento = Lancamento::create(['barraquinha_id' => $barraquinha->id, 'tipo' => 'saida', 'categoria' => 'insumos', 'descricao' => 'Gás', 'valor' => 80, 'data' => today()]);
        $v3 = $this->pulso($user, 'barraquinha.pulso');
        $this->assertNotSame($v2, $v3);

        $this->travel(2)->seconds();
        $lancamento->delete();
        $this->assertNotSame($v3, $this->pulso($user, 'barraquinha.pulso'), 'Exclusão lógica também conta.');
    }

    public function test_pulso_da_barraquinha_ignora_as_outras_e_o_do_admin_ve_a_feira_toda(): void
    {
        $feira = $this->criarFeira();
        [$a] = $this->cenarioPastelaria($feira);
        $b = $this->criarBarraquinha($feira, 'Doces da Vó');
        $brigadeiro = $this->criarItem($b, 'Brigadeiro', 4.00);
        $userA = $this->usuarioDa($a);
        $userB = $this->usuarioDa($b);
        $admin = $this->criarAdmin();

        $antesA = $this->pulso($userA, 'barraquinha.pulso');
        $antesAdmin = $this->pulso($admin, 'admin.painel.pulso');

        $this->vender($userB, $brigadeiro->id);

        $this->assertSame($antesA, $this->pulso($userA, 'barraquinha.pulso'));
        $this->assertNotSame($antesAdmin, $this->pulso($admin, 'admin.painel.pulso'));
    }

    public function test_painel_entrega_a_mesma_versao_do_pulso(): void
    {
        [$barraquinha] = $this->cenarioPastelaria();
        $user = $this->usuarioDa($barraquinha);
        $versao = $this->pulso($user, 'barraquinha.pulso');

        $this->como($user)->get(route('barraquinha.painel'))
            ->assertInertia(fn ($page) => $page->component('loja/Painel')->where('versao', $versao));

        $admin = $this->criarAdmin();
        $versaoAdmin = $this->pulso($admin, 'admin.painel.pulso');
        $this->como($admin)->get(route('admin.painel'))
            ->assertInertia(fn ($page) => $page->component('admin/Painel')->where('versao', $versaoAdmin));
    }

    public function test_recarga_parcial_traz_so_as_props_pedidas(): void
    {
        [$barraquinha, $pastel] = $this->cenarioPastelaria();
        $user = $this->usuarioDa($barraquinha);
        $this->vender($user, $pastel->id);

        $this->como($user)->get(route('barraquinha.painel'))
            ->assertInertia(fn ($page) => $page->reloadOnly(['ultimas', 'versao'], fn ($parcial) => $parcial
                ->has('ultimas', 1)
                ->missing('ranking')
                ->missing('indicadores')));
    }

    public function test_cada_perfil_so_consulta_o_proprio_pulso(): void
    {
        [$barraquinha] = $this->cenarioPastelaria();

        $this->getJson(route('barraquinha.pulso'))->assertUnauthorized();
        $this->como($this->usuarioDa($barraquinha))->getJson(route('admin.painel.pulso'))->assertForbidden();
        $this->como($this->criarAdmin())->getJson(route('barraquinha.pulso'))->assertForbidden();
    }
}
