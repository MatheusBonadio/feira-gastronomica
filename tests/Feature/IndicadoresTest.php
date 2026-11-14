<?php

namespace Tests\Feature;

use App\Enums\LancamentoCategoria;
use App\Models\Feira;
use App\Models\Lancamento;
use App\Services\Financeiro\IndicadoresService;
use Database\Seeders\Feira2026Seeder;
use Tests\TestCase;

/** Seção 8 e anexo da seção 12: indicadores calculados, nunca armazenados. */
class IndicadoresTest extends TestCase
{
    public function test_carga_de_2026_bate_com_o_relatorio_consolidado(): void
    {
        $this->seed(Feira2026Seeder::class);
        $servico = app(IndicadoresService::class);
        $feira = Feira::sole();

        $porBarraquinha = $servico->porBarraquinha($feira->barraquinhas()->get());
        $total = $servico->consolidar($porBarraquinha);

        $this->assertEqualsWithDelta(164172.67, $total->vendas, 0.001);
        $this->assertEqualsWithDelta(105102.27, $total->custos, 0.001);
        $this->assertEqualsWithDelta(37395.65, $total->despesas, 0.001);
        $this->assertEqualsWithDelta(21674.75, $total->resultadoOperacional(), 0.001);
        $this->assertSame('13.2', number_format($total->margem() * 100, 1));

        $frango = $feira->barraquinhas()->where('nome', 'Frango Supremo')->sole();
        $this->assertEqualsWithDelta(-3171.28, $porBarraquinha[$frango->id]->resultadoOperacional(), 0.001);

        $petisquim = $feira->barraquinhas()->where('nome', 'Petisquim')->sole();
        $this->assertEqualsWithDelta(24412.44, $porBarraquinha[$petisquim->id]->vendasPorCanal['pre_venda'], 0.001);
    }

    public function test_investimento_sai_do_caixa_mas_nao_do_resultado_operacional(): void
    {
        $barraquinha = $this->criarBarraquinha();
        foreach ([[LancamentoCategoria::Patrocinio, 300], [LancamentoCategoria::Insumos, 100], [LancamentoCategoria::Embalagem, 50], [LancamentoCategoria::Investimento, 200]] as [$categoria, $valor]) {
            Lancamento::create(['barraquinha_id' => $barraquinha->id, 'tipo' => $categoria->tipo(), 'categoria' => $categoria, 'descricao' => 'x', 'valor' => $valor, 'data' => today()]);
        }

        $i = app(IndicadoresService::class)->daBarraquinha($barraquinha);

        $this->assertEquals(300, $i->outrasEntradas);
        $this->assertEquals(350, $i->saidas());
        $this->assertEquals(-150, $i->resultadoOperacional());
        $this->assertEquals(-50, $i->saldoCaixa());
    }

    public function test_painel_do_admin_ordena_por_qualquer_coluna(): void
    {
        $feira = $this->criarFeira();
        $a = $this->criarBarraquinha($feira, 'Alfa');
        $b = $this->criarBarraquinha($feira, 'Beta');
        Lancamento::create(['barraquinha_id' => $a->id, 'tipo' => 'saida', 'categoria' => 'mercadoria', 'descricao' => 'x', 'valor' => 10, 'data' => today()]);

        $this->actingAs($this->criarAdmin())
            ->get(route('admin.painel', ['ordem' => 'resultado', 'direcao' => 'asc']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/Painel')->where('linhas.0.barraquinha.nome', 'Alfa'));
    }
}
