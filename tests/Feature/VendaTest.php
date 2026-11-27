<?php

namespace Tests\Feature;

use App\Enums\FeiraStatus;
use App\Models\Venda;
use App\Models\VendaItem;
use App\Services\Financeiro\IndicadoresService;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class VendaTest extends TestCase
{
    public function test_registra_venda_classificada_como_combo_com_o_preco_do_combo(): void
    {
        [$barraquinha, $pastel, $refri] = $this->cenarioPastelaria();

        $this->actingAs($this->usuarioDa($barraquinha))
            ->post(route('barraquinha.vendas.store'), [
                'canal' => 'feira',
                'pagamento' => 'pix',
                'itens' => [$pastel->id => 2, $refri->id => 1],
            ])
            ->assertRedirect(route('barraquinha.vendas.create'));

        $venda = Venda::withoutGlobalScopes()->with('linhas')->sole();
        $this->assertSame('Combo 1 + Comum', $venda->resumo());
        $this->assertEquals(53.00, (float) $venda->total);
        $this->assertEquals(3.00, (float) $venda->desconto);
        $this->assertSame(1, $venda->numero);

        $this->assertSame(2, (int) VendaItem::withoutGlobalScopes()->where('item_id', $pastel->id)->sum('quantidade'));
    }

    public function test_previa_do_pdv_usa_o_mesmo_algoritmo_e_o_preco_do_canal(): void
    {
        [$barraquinha, $pastel] = $this->cenarioPastelaria();

        $this->actingAs($this->usuarioDa($barraquinha))
            ->postJson(route('barraquinha.vendas.simular'), ['canal' => 'pre_venda', 'itens' => [$pastel->id => 2]])
            ->assertOk()
            ->assertJsonPath('resumo', 'Comum')
            ->assertJsonPath('total', 36);
    }

    public function test_pdv_recebe_o_preco_de_cada_combo_por_canal(): void
    {
        [$barraquinha, , , $combo] = $this->cenarioPastelaria();

        $this->actingAs($this->usuarioDa($barraquinha))
            ->get(route('barraquinha.vendas.create'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('loja/vendas/Pdv')
                ->where('combos.0.id', $combo->id)
                ->where('combos.0.precos.feira', 28)
                ->where('combos.0.avulsos.feira', 31)
                ->where('combos.0.precos.pre_venda', 28)
                ->where('combos.0.avulsos.pre_venda', 24));
    }

    public function test_lancar_um_combo_no_pdv_aplica_o_desconto_e_identifica_o_combo(): void
    {
        [$barraquinha, $pastel, $refri, $combo] = $this->cenarioPastelaria();

        $this->actingAs($this->usuarioDa($barraquinha))
            ->postJson(route('barraquinha.vendas.simular'), ['canal' => 'feira', 'itens' => [$pastel->id => 1, $refri->id => 1]])
            ->assertOk()
            ->assertJsonPath('resumo', 'Combo 1')
            ->assertJsonPath('linhas.0.combo_id', $combo->id)
            ->assertJsonPath('desconto', 3)
            ->assertJsonPath('total', 28);
    }

    public function test_alterar_preco_nao_muda_vendas_passadas(): void
    {
        [$barraquinha, $pastel] = $this->cenarioPastelaria();
        $user = $this->usuarioDa($barraquinha);

        $this->actingAs($user)->post(route('barraquinha.vendas.store'), ['canal' => 'feira', 'pagamento' => 'dinheiro', 'itens' => [$pastel->id => 1]]);

        $this->actingAs($user)->put(route('barraquinha.itens.update', $pastel), [
            'nome' => 'Pastel de carne',
            'categoria_id' => $pastel->categoria_id,
            'ativo' => true,
            'precos' => ['feira' => 30],
        ])->assertRedirect();

        $venda = Venda::withoutGlobalScopes()->with('linhas')->sole();
        $this->assertEquals(25.00, (float) $venda->linhas->first()->preco_unitario);
        $this->assertEquals(25.00, (float) $venda->total);
        $this->assertDatabaseHas('auditoria_logs', ['acao' => 'preco_alterado']);
    }

    public function test_cancelar_exige_motivo_mantem_o_registro_e_tira_dos_totais(): void
    {
        [$barraquinha, $pastel] = $this->cenarioPastelaria();
        $user = $this->usuarioDa($barraquinha);
        $this->actingAs($user)->post(route('barraquinha.vendas.store'), ['canal' => 'feira', 'pagamento' => 'pix', 'itens' => [$pastel->id => 1]]);
        $venda = Venda::withoutGlobalScopes()->sole();

        $this->actingAs($user)->patch(route('barraquinha.vendas.cancelar', $venda), ['motivo' => ''])->assertSessionHasErrors('motivo');
        $this->actingAs($user)->patch(route('barraquinha.vendas.cancelar', $venda), ['motivo' => 'Cliente desistiu'])->assertRedirect();

        $venda->refresh();
        $this->assertTrue($venda->estaCancelada());
        $this->assertSame('Cliente desistiu', $venda->motivo_cancelamento);
        $this->assertEquals(0.0, app(IndicadoresService::class)->daBarraquinha($barraquinha)->vendas);
        $this->assertDatabaseHas('auditoria_logs', ['acao' => 'venda_cancelada']);
    }

    public function test_feira_encerrada_bloqueia_novas_vendas(): void
    {
        $feira = $this->criarFeira(['status' => FeiraStatus::Encerrada]);
        [$barraquinha, $pastel] = $this->cenarioPastelaria($feira);

        $this->actingAs($this->usuarioDa($barraquinha))
            ->post(route('barraquinha.vendas.store'), ['canal' => 'feira', 'pagamento' => 'pix', 'itens' => [$pastel->id => 1]])
            ->assertSessionHasErrors('feira');

        $this->assertSame(0, Venda::withoutGlobalScopes()->count());
    }

    public function test_item_de_outra_barraquinha_no_carrinho_e_ignorado(): void
    {
        $feira = $this->criarFeira();
        [$barraquinha, $pastel] = $this->cenarioPastelaria($feira);
        $alheio = $this->criarItem($this->criarBarraquinha($feira, 'Outra'), 'Caro', 100);

        $this->actingAs($this->usuarioDa($barraquinha))
            ->post(route('barraquinha.vendas.store'), ['canal' => 'feira', 'pagamento' => 'pix', 'itens' => [$pastel->id => 1, $alheio->id => 3]]);

        $this->assertEquals(25.00, (float) Venda::withoutGlobalScopes()->sole()->total);
    }

    public function test_admin_consulta_vendas_mas_nao_tem_pdv(): void
    {
        [$barraquinha] = $this->cenarioPastelaria();
        $admin = $this->criarAdmin();

        $this->actingAs($admin)->get(route('admin.loja.vendas.index', $barraquinha))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('loja/vendas/Index')->where('loja.podeVender', false));

        $this->assertFalse(\Illuminate\Support\Facades\Route::has('admin.loja.vendas.create'));
    }
}
