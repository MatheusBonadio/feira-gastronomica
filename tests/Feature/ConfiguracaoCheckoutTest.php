<?php

namespace Tests\Feature;

use App\Models\Venda;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ConfiguracaoCheckoutTest extends TestCase
{
    private function preferencias(array $extras = []): array
    {
        return [
            'pagamentos' => ['pix', 'cartao'],
            'pagamento_padrao' => 'pix',
            'canal_padrao' => 'pre_venda',
            'exibicao' => 'lista',
            'agrupar_categorias' => false,
            'ordem' => 'mais_vendidos',
            'mostrar_combos' => false,
            'calcular_troco' => true,
            'chave_pix' => 'pastelaria@exemplo.com',
            'confirmar_antes' => true,
            ...$extras,
        ];
    }

    public function test_pdv_padrao_sem_configuracao(): void
    {
        [$barraquinha] = $this->cenarioPastelaria();

        $this->actingAs($this->usuarioDa($barraquinha))->get(route('barraquinha.vendas.create'))
            ->assertInertia(fn (Assert $p) => $p
                ->component('loja/vendas/Pdv')
                ->has('pagamentos', 3)
                ->where('canalInicial', 'feira')
                ->where('checkout.exibicao', 'grade')
                ->where('checkout.pagamentoPadrao', null)
                ->where('checkout.mostrarCombos', true));
    }

    public function test_salva_e_o_pdv_segue_a_configuracao(): void
    {
        [$barraquinha, $pastel, $refri] = $this->cenarioPastelaria();
        $usuario = $this->usuarioDa($barraquinha);

        $this->actingAs($usuario)->post(route('barraquinha.vendas.store'), ['canal' => 'feira', 'pagamento' => 'dinheiro', 'itens' => [$refri->id => 3]]);

        $this->actingAs($usuario)->put(route('barraquinha.configuracoes.checkout'), $this->preferencias())
            ->assertRedirect()->assertSessionHasNoErrors();

        $this->actingAs($usuario)->get(route('barraquinha.vendas.create'))
            ->assertInertia(fn (Assert $p) => $p
                ->where('pagamentos.0.valor', 'pix')
                ->where('pagamentos.1.valor', 'cartao')
                ->has('pagamentos', 2)
                ->where('canalInicial', 'pre_venda')
                ->where('itens.0.nome', 'Refrigerante')
                ->where('itens.1.nome', 'Pastel de carne')
                ->where('checkout.pagamentoPadrao', 'pix')
                ->where('checkout.exibicao', 'lista')
                ->where('checkout.chavePix', 'pastelaria@exemplo.com')
                ->where('checkout.confirmarAntes', true));
    }

    public function test_forma_de_pagamento_desativada_e_recusada_no_servidor(): void
    {
        [$barraquinha, $pastel] = $this->cenarioPastelaria();
        $usuario = $this->usuarioDa($barraquinha);
        $this->actingAs($usuario)->put(route('barraquinha.configuracoes.checkout'), $this->preferencias());

        $this->actingAs($usuario)
            ->post(route('barraquinha.vendas.store'), ['canal' => 'feira', 'pagamento' => 'dinheiro', 'itens' => [$pastel->id => 1]])
            ->assertSessionHasErrors('pagamento');
        $this->assertSame(0, Venda::withoutGlobalScopes()->count());

        $this->actingAs($usuario)
            ->post(route('barraquinha.vendas.store'), ['canal' => 'feira', 'pagamento' => 'pix', 'itens' => [$pastel->id => 1]])
            ->assertSessionHasNoErrors();
        $this->assertSame(1, Venda::withoutGlobalScopes()->count());
    }

    public function test_valida_as_escolhas(): void
    {
        [$barraquinha] = $this->cenarioPastelaria();
        $usuario = $this->usuarioDa($barraquinha);

        $this->actingAs($usuario)
            ->put(route('barraquinha.configuracoes.checkout'), $this->preferencias(['pagamentos' => [], 'exibicao' => 'mosaico']))
            ->assertSessionHasErrors(['pagamentos', 'exibicao']);

        $this->actingAs($usuario)
            ->put(route('barraquinha.configuracoes.checkout'), $this->preferencias(['pagamentos' => ['cartao'], 'pagamento_padrao' => 'pix']))
            ->assertSessionHasErrors('pagamento_padrao');

        $this->assertNull($barraquinha->fresh()->checkout);
    }

    public function test_foto_da_barraquinha_e_configuracao_pelo_admin(): void
    {
        Storage::fake('fotos');
        [$barraquinha] = $this->cenarioPastelaria();
        $usuario = $this->usuarioDa($barraquinha);

        $this->actingAs($usuario)->post(route('barraquinha.configuracoes.foto'), ['foto' => PerfilTest::png()])->assertSessionHasNoErrors();
        $caminho = $barraquinha->fresh()->foto_path;
        $this->assertStringStartsWith('barraquinhas/', $caminho);

        $this->actingAs($usuario)->get(route('barraquinha.painel'))
            ->assertInertia(fn (Assert $p) => $p->where('barraquinha.foto', '/fotos/'.$caminho));

        $this->flushSession();
        $this->actingAs($this->criarAdmin())
            ->put(route('admin.loja.configuracoes.checkout', ['barraquinha' => $barraquinha->id]), $this->preferencias(['pagamentos' => ['cartao'], 'pagamento_padrao' => null]))
            ->assertSessionHasNoErrors();
        $this->assertSame('cartao', $barraquinha->fresh()->preferenciasCheckout()->pagamentoPadrao);
    }
}
