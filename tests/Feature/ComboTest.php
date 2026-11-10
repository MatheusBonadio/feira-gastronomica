<?php

namespace Tests\Feature;

use App\Models\Combo;
use App\Services\Vendas\VendaService;
use App\Enums\Canal;
use Tests\TestCase;

/** Seção 6: combos só com itens cadastrados, numerados pelo sistema, com as validações da especificação. */
class ComboTest extends TestCase
{
    private function payload(array $itens, float $valor, string $tipo = 'preco_fechado', array $extra = []): array
    {
        return [
            'nome' => 'Combo do Guerreiro',
            'tipo_desconto' => $tipo,
            'valor' => $valor,
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

        $combo = Combo::withoutGlobalScopes()->with('itens.precos')->sole();
        $this->assertEquals(54.00, $combo->somaAvulsa());
        $this->assertEquals(48.60, $combo->precoPara());
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
