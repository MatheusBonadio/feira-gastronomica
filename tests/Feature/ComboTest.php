<?php

namespace Tests\Feature;

use App\Models\Combo;
use App\Models\ComboCanal;
use App\Services\Vendas\VendaService;
use App\Enums\Canal;
use Tests\TestCase;

class ComboTest extends TestCase
{
    /** Sem $canais, o combo vale só na Feira com a regra informada. */
    private function payload(array $itens, float $valor, string $tipo = 'preco_fechado', array $extra = [], ?array $canais = null): array
    {
        $canais ??= ['feira' => [$tipo, $valor]];

        return [
            'nome' => 'Combo do Guerreiro',
            'canais' => collect(Canal::cases())->mapWithKeys(fn (Canal $c) => [$c->value => isset($canais[$c->value])
                ? ['ativo' => true, 'tipo_desconto' => $canais[$c->value][0], 'valor' => $canais[$c->value][1]]
                : ['ativo' => false]])->all(),
            'selecionado' => array_fill_keys(array_keys($itens), true),
            'quantidade' => $itens,
            ...$extra,
        ];
    }

    public function test_numera_automaticamente_dentro_da_barraquinha(): void
    {
        $barraquinha = $this->criarBarraquinha();
        $pastel = $this->criarItem($barraquinha, 'Pastel', 25);
        $refri = $this->criarItem($barraquinha, 'Refri', 6);
        $doce = $this->criarItem($barraquinha, 'Doce', 15);
        $user = $this->usuarioDa($barraquinha);

        $this->actingAs($user)->post(route('barraquinha.combos.store'), $this->payload([$pastel->id => 1, $refri->id => 1], 28))->assertSessionHasNoErrors();
        $this->actingAs($user)->post(route('barraquinha.combos.store'), $this->payload([$pastel->id => 1, $doce->id => 1], 36))->assertSessionHasNoErrors();

        $this->assertSame([1, 2], Combo::withoutGlobalScopes()->orderBy('numero')->pluck('numero')->all());
    }

    public function test_exige_ao_menos_duas_unidades(): void
    {
        $barraquinha = $this->criarBarraquinha();
        $pastel = $this->criarItem($barraquinha, 'Pastel', 25);

        $this->actingAs($this->usuarioDa($barraquinha))
            ->post(route('barraquinha.combos.store'), $this->payload([$pastel->id => 1], 20))
            ->assertSessionHasErrors('itens');
    }

    public function test_sem_desconto_pede_confirmacao(): void
    {
        $barraquinha = $this->criarBarraquinha();
        $pastel = $this->criarItem($barraquinha, 'Pastel', 25);
        $refri = $this->criarItem($barraquinha, 'Refri', 6);
        $user = $this->usuarioDa($barraquinha);

        $this->actingAs($user)->post(route('barraquinha.combos.store'), $this->payload([$pastel->id => 1, $refri->id => 1], 31))
            ->assertSessionHasErrors('confirmar_sem_desconto');

        $this->actingAs($user)->post(route('barraquinha.combos.store'), $this->payload([$pastel->id => 1, $refri->id => 1], 31, extra: ['confirmar_sem_desconto' => true]))
            ->assertSessionHasNoErrors();
    }

    public function test_percentual_calcula_o_preco_sobre_a_soma_avulsa(): void
    {
        $barraquinha = $this->criarBarraquinha();
        $pizza = $this->criarItem($barraquinha, 'Minipizza', 8);
        $refri = $this->criarItem($barraquinha, 'Refri 2L', 14);

        $this->actingAs($this->usuarioDa($barraquinha))
            ->post(route('barraquinha.combos.store'), $this->payload([$pizza->id => 5, $refri->id => 1], 10, 'percentual'))
            ->assertSessionHasNoErrors();

        $combo = Combo::withoutGlobalScopes()->with(['itens.precos', 'canais'])->sole();
        $this->assertEquals(54.00, $combo->somaAvulsa(Canal::Feira));
        $this->assertEquals(48.60, $combo->precoPara(Canal::Feira));
    }

    public function test_cada_canal_tem_a_propria_regra_e_o_combo_so_vale_nos_canais_marcados(): void
    {
        $barraquinha = $this->criarBarraquinha();
        $pastel = $this->criarItem($barraquinha, 'Pastel', 25, 18);
        $refri = $this->criarItem($barraquinha, 'Refri', 6);

        $this->actingAs($this->usuarioDa($barraquinha))
            ->post(route('barraquinha.combos.store'), $this->payload([$pastel->id => 1, $refri->id => 1], 0, canais: [
                'pre_venda' => ['preco_fechado', 22],
                'feira' => ['percentual', 10],
            ]))
            ->assertSessionHasNoErrors();

        $combo = Combo::withoutGlobalScopes()->with(['itens.precos', 'canais'])->sole();
        $this->assertSame(2, ComboCanal::withoutGlobalScopes()->count());
        $this->assertEquals(22.00, $combo->precoPara(Canal::PreVenda));
        $this->assertEquals(27.90, $combo->precoPara(Canal::Feira));
        $this->assertNull($combo->precoPara(Canal::PosEvento));

        $vendas = app(VendaService::class);
        $carrinho = [$pastel->id => 1, $refri->id => 1];
        $this->assertSame([2200, 'Combo 1'], [$vendas->simular($barraquinha, Canal::PreVenda, $carrinho)->total(), $vendas->simular($barraquinha, Canal::PreVenda, $carrinho)->resumo()]);
        $this->assertSame([2790, 'Combo 1'], [$vendas->simular($barraquinha, Canal::Feira, $carrinho)->total(), $vendas->simular($barraquinha, Canal::Feira, $carrinho)->resumo()]);
        $this->assertSame([3100, 'Comum'], [$vendas->simular($barraquinha, Canal::PosEvento, $carrinho)->total(), $vendas->simular($barraquinha, Canal::PosEvento, $carrinho)->resumo()]);
    }

    public function test_exige_ao_menos_um_canal_e_o_desconto_de_cada_canal_marcado(): void
    {
        $barraquinha = $this->criarBarraquinha();
        $pastel = $this->criarItem($barraquinha, 'Pastel', 25);
        $refri = $this->criarItem($barraquinha, 'Refri', 6);
        $user = $this->usuarioDa($barraquinha);
        $itens = [$pastel->id => 1, $refri->id => 1];

        $this->actingAs($user)->post(route('barraquinha.combos.store'), $this->payload($itens, 0, canais: []))
            ->assertSessionHasErrors('canais');

        $this->actingAs($user)->post(route('barraquinha.combos.store'), [
            ...$this->payload($itens, 28),
            'canais' => ['feira' => ['ativo' => true, 'tipo_desconto' => 'preco_fechado', 'valor' => null]],
        ])->assertSessionHasErrors('canais.feira.valor');

        $this->assertSame(0, Combo::withoutGlobalScopes()->count());
    }

    public function test_sem_desconto_em_um_canal_pede_confirmacao(): void
    {
        $barraquinha = $this->criarBarraquinha();
        $pastel = $this->criarItem($barraquinha, 'Pastel', 25, 18);
        $refri = $this->criarItem($barraquinha, 'Refri', 6);
        $user = $this->usuarioDa($barraquinha);
        $canais = ['pre_venda' => ['preco_fechado', 28], 'feira' => ['preco_fechado', 28]];

        $this->actingAs($user)->post(route('barraquinha.combos.store'), $this->payload([$pastel->id => 1, $refri->id => 1], 0, canais: $canais))
            ->assertSessionHasErrors(['confirmar_sem_desconto' => 'Sem desconto em Pré-venda (soma avulsa R$ 24,00): o preço do combo não é menor que a soma avulsa. Confirme para salvar mesmo assim. O cliente nunca paga mais do que pagaria avulso, então um combo mais caro não é aplicado.']);
    }

    public function test_nao_permite_duas_composicoes_iguais_ativas(): void
    {
        [$barraquinha, $pastel, $refri] = $this->cenarioPastelaria();

        $this->actingAs($this->usuarioDa($barraquinha))
            ->post(route('barraquinha.combos.store'), $this->payload([$pastel->id => 1, $refri->id => 1], 27))
            ->assertSessionHasErrors('itens');
    }

    public function test_item_inativado_deixa_o_combo_incompleto_e_fora_da_classificacao(): void
    {
        [$barraquinha, $pastel, $refri, $combo] = $this->cenarioPastelaria();
        $refri->update(['ativo' => false]);

        $this->assertTrue($combo->fresh()->load('itens')->estaIncompleto());

        $resultado = app(VendaService::class)->simular($barraquinha, Canal::Feira, [$pastel->id => 1, $refri->id => 1]);
        $this->assertSame('Comum', $resultado->resumo());
    }

    public function test_combo_vendido_nao_pode_ser_excluido_so_desativado(): void
    {
        [$barraquinha, $pastel, $refri, $combo] = $this->cenarioPastelaria();
        $user = $this->usuarioDa($barraquinha);
        $this->actingAs($user)->post(route('barraquinha.vendas.store'), ['canal' => 'feira', 'pagamento' => 'pix', 'itens' => [$pastel->id => 1, $refri->id => 1]]);

        $this->actingAs($user)->delete(route('barraquinha.combos.destroy', $combo))->assertSessionHasErrors('combo');
        $this->actingAs($user)->patch(route('barraquinha.combos.alternar', $combo))->assertSessionHasNoErrors();

        $this->assertFalse($combo->fresh()->ativo);
    }
}
