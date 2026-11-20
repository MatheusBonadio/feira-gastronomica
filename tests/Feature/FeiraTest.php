<?php

namespace Tests\Feature;

use App\Models\Barraquinha;
use App\Models\Feira;
use App\Models\Item;
use App\Models\Venda;
use App\Services\FeiraService;
use App\Services\Vendas\VendaService;
use App\Enums\Canal;
use App\Enums\FormaPagamento;
use Tests\TestCase;

class FeiraTest extends TestCase
{
    public function test_criar_feira_gera_as_vagas_em_branco(): void
    {
        $this->actingAs($this->criarAdmin())->post(route('admin.feiras.store'), [
            'nome' => 'Feira Gastronômica 2028',
            'data_inicio' => '2028-10-10',
            'data_fim' => '2028-10-11',
            'status' => 'planejada',
            'qtd_barraquinhas' => 12,
        ])->assertRedirect(route('admin.barraquinhas.index'));

        $feira = Feira::sole();
        $this->assertSame(12, $feira->barraquinhas()->count());
        $this->assertTrue($feira->barraquinhas()->first()->ehVaga());
    }

    public function test_nao_reduz_abaixo_das_barraquinhas_com_vendas(): void
    {
        $feira = $this->criarFeira();
        [$barraquinha, $pastel] = $this->cenarioPastelaria($feira);
        $this->criarBarraquinha($feira, 'Sem vendas');
        app(VendaService::class)->registrar($barraquinha, $this->usuarioDa($barraquinha), Canal::Feira, FormaPagamento::Pix, [$pastel->id => 1]);

        $servico = app(FeiraService::class);
        $servico->ajustarQuantidade($feira->fresh(), 1);
        $this->assertSame(1, $feira->barraquinhas()->count());
        $this->assertSame($barraquinha->id, $feira->barraquinhas()->value('id'));

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $servico->ajustarQuantidade($feira->fresh(), 0);
    }

    public function test_duplicar_copia_barraquinhas_e_itens_mas_nao_vendas(): void
    {
        $feira = $this->criarFeira();
        [$barraquinha, $pastel] = $this->cenarioPastelaria($feira);
        app(VendaService::class)->registrar($barraquinha, $this->usuarioDa($barraquinha), Canal::Feira, FormaPagamento::Pix, [$pastel->id => 1]);

        $this->actingAs($this->criarAdmin())->post(route('admin.feiras.duplicar.store', $feira), [
            'nome' => 'Feira 2028', 'data_inicio' => '2028-10-10', 'data_fim' => '2028-10-11',
        ])->assertRedirect();

        $nova = Feira::where('nome', 'Feira 2028')->sole();
        $copia = Barraquinha::where('feira_id', $nova->id)->sole();
        $this->assertSame('Senhor dos Pastéis', $copia->nome);
        $this->assertSame(2, Item::withoutGlobalScopes()->where('barraquinha_id', $copia->id)->count());
        $this->assertSame(0, Venda::withoutGlobalScopes()->where('feira_id', $nova->id)->count());
        $this->assertNull($copia->usuario);
    }

    public function test_encerrar_e_reabrir(): void
    {
        $admin = $this->criarAdmin();
        $feira = $this->criarFeira();

        $this->actingAs($admin)->patch(route('admin.feiras.encerrar', $feira))->assertRedirect();
        $this->assertTrue($feira->fresh()->estaEncerrada());

        $this->actingAs($admin)->patch(route('admin.feiras.reabrir', $feira))->assertRedirect();
        $this->assertFalse($feira->fresh()->estaEncerrada());
    }
}
