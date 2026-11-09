<?php

namespace Tests\Feature;

use App\Enums\AcaoAuditoria;
use App\Models\AuditoriaLog;
use App\Models\Item;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Seção 2: uma barraquinha nunca vê dados, itens, combos ou valores de outra. */
class IsolamentoTest extends TestCase
{
    public function test_lista_so_os_itens_da_propria_barraquinha(): void
    {
        $feira = $this->criarFeira();
        $minha = $this->criarBarraquinha($feira, 'Minha');
        $outra = $this->criarBarraquinha($feira, 'Outra');
        $this->criarItem($minha, 'Pastel', 25);
        $this->criarItem($outra, 'Segredo da outra', 99);

        $this->actingAs($this->usuarioDa($minha))
            ->get(route('barraquinha.itens.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('loja/itens/Index')
                ->has('itens', 1)
                ->where('itens.0.nome', 'Pastel'));
    }

    public function test_link_para_item_de_outra_barraquinha_da_acesso_negado_e_auditoria(): void
    {
        $feira = $this->criarFeira();
        $minha = $this->criarBarraquinha($feira, 'Minha');
        $alheio = $this->criarItem($this->criarBarraquinha($feira, 'Outra'), 'Pastel', 25);
        $user = $this->usuarioDa($minha);

        $this->actingAs($user)->get(route('barraquinha.itens.edit', $alheio))->assertForbidden();
        $this->actingAs($user)->put(route('barraquinha.itens.update', $alheio), ['nome' => 'invadido'])->assertForbidden();

        $this->assertSame('Pastel', Item::withoutGlobalScopes()->find($alheio->id)->nome);
        $this->assertSame(2, AuditoriaLog::where('acao', AcaoAuditoria::AcessoNegado->value)->where('user_id', $user->id)->count());
    }

    public function test_id_inexistente_tambem_responde_acesso_negado_para_nao_revelar_existencia(): void
    {
        $user = $this->usuarioDa($this->criarBarraquinha());

        $this->actingAs($user)->get(route('barraquinha.itens.edit', ['item' => 999999]))->assertForbidden();
    }

    public function test_barraquinha_nao_acessa_nada_do_admin(): void
    {
        $user = $this->usuarioDa($this->criarBarraquinha());

        foreach (['admin.painel', 'admin.feiras.index', 'admin.barraquinhas.index', 'admin.auditoria.index', 'admin.relatorios.index'] as $rota) {
            $this->actingAs($user)->get(route($rota))->assertForbidden();
        }
    }

    public function test_barraquinha_nao_recebe_lista_de_barraquinhas_nem_rotas_do_admin(): void
    {
        $user = $this->usuarioDa($this->criarBarraquinha());

        $this->actingAs($user)
            ->get(route('barraquinha.painel'))
            ->assertOk()
            ->assertDontSee('admin.painel')
            ->assertInertia(fn (Assert $page) => $page->where('seletorFeira', null));
    }

    public function test_admin_ve_qualquer_barraquinha_mas_registro_precisa_ser_da_barraquinha_da_url(): void
    {
        $admin = $this->criarAdmin();
        $feira = $this->criarFeira();
        $a = $this->criarBarraquinha($feira, 'A');
        $b = $this->criarBarraquinha($feira, 'B');
        $itemDeB = $this->criarItem($b, 'Pastel', 25);

        $this->actingAs($admin)->get(route('admin.loja.itens.edit', ['barraquinha' => $b, 'item' => $itemDeB]))->assertOk();
        $this->actingAs($admin)->get(route('admin.loja.itens.edit', ['barraquinha' => $a, 'item' => $itemDeB]))->assertNotFound();
    }

    public function test_cadastro_ignora_barraquinha_enviada_pela_tela(): void
    {
        $feira = $this->criarFeira();
        $minha = $this->criarBarraquinha($feira, 'Minha');
        $outra = $this->criarBarraquinha($feira, 'Outra');
        $categoria = \App\Models\Categoria::firstOrCreate(['nome' => 'Comida']);

        $this->actingAs($this->usuarioDa($minha))->post(route('barraquinha.itens.store'), [
            'nome' => 'Pastel',
            'categoria_id' => $categoria->id,
            'barraquinha_id' => $outra->id,
            'ativo' => true,
            'precos' => ['feira' => 25],
        ])->assertRedirect();

        $this->assertSame($minha->id, Item::withoutGlobalScopes()->where('nome', 'Pastel')->value('barraquinha_id'));
    }
}
