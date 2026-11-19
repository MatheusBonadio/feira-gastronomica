<?php

namespace Tests\Feature;

use App\Models\Lancamento;
use App\Models\User;
use App\Services\Financeiro\IndicadoresService;
use Tests\TestCase;

/** Blocos do painel: série por canal, saídas por categoria, edição anterior, estoque e pendências. */
class PainelTest extends TestCase
{
    /** Troca de usuário como um login novo faria (o auth.session confere o hash da senha na sessão). */
    private function como(User $user): static
    {
        return $this->flushSession()->actingAs($user);
    }

    private function vender(User $user, string $canal, array $itens): void
    {
        $this->como($user)->post(route('barraquinha.vendas.store'), ['canal' => $canal, 'pagamento' => 'pix', 'itens' => $itens])->assertRedirect();
    }

    public function test_serie_diaria_traz_a_quebra_por_canal(): void
    {
        [$barraquinha, $pastel, $refri] = $this->cenarioPastelaria();
        $user = $this->usuarioDa($barraquinha);
        $this->vender($user, 'feira', [$pastel->id => 1]);          // 25
        $this->vender($user, 'pre_venda', [$pastel->id => 1]);      // 18 (preço de pré-venda)
        $this->vender($user, 'feira', [$refri->id => 2]);           // 12

        $serie = app(IndicadoresService::class)->serieDiaria([$barraquinha->id]);

        $this->assertCount(1, $serie);
        $this->assertEqualsWithDelta(55.0, $serie[0]['total'], 0.001);
        $this->assertSame(3, $serie[0]['qtd']);
        $this->assertEqualsWithDelta(37.0, $serie[0]['porCanal']['feira'], 0.001);
        $this->assertEqualsWithDelta(18.0, $serie[0]['porCanal']['pre_venda'], 0.001);
        $this->assertEqualsWithDelta(0.0, $serie[0]['porCanal']['pos_evento'], 0.001);
    }

    public function test_saidas_por_categoria_ignora_entradas_e_ordena_pelo_total(): void
    {
        $barraquinha = $this->criarBarraquinha();
        foreach ([['patrocinio', 500], ['insumos', 80], ['mercadoria', 300], ['insumos', 40]] as [$categoria, $valor]) {
            Lancamento::create([
                'barraquinha_id' => $barraquinha->id,
                'tipo' => $categoria === 'patrocinio' ? 'entrada' : 'saida',
                'categoria' => $categoria,
                'descricao' => 'x',
                'valor' => $valor,
                'data' => today(),
            ]);
        }

        $saidas = app(IndicadoresService::class)->saidasPorCategoria([$barraquinha->id]);

        $this->assertSame(['mercadoria', 'insumos'], $saidas->map(fn ($l) => $l['categoria']->value)->all());
        $this->assertEqualsWithDelta(120.0, $saidas[1]['total'], 0.001);
    }

    public function test_painel_do_admin_compara_com_a_edicao_anterior_so_sem_filtro_de_datas(): void
    {
        $anterior = $this->criarFeira(['nome' => 'Feira 2026', 'data_inicio' => '2026-10-15', 'data_fim' => '2026-10-16']);
        [$antiga] = $this->cenarioPastelaria($anterior);
        Lancamento::create(['barraquinha_id' => $antiga->id, 'tipo' => 'saida', 'categoria' => 'insumos', 'descricao' => 'x', 'valor' => 70, 'data' => '2026-10-15']);
        $atual = $this->criarFeira(['nome' => 'Feira 2027']);
        $this->cenarioPastelaria($atual);
        $admin = $this->criarAdmin();
        $this->como($admin)->post(route('admin.feiras.selecionar', $atual));

        $this->get(route('admin.painel'))->assertInertia(fn ($page) => $page
            ->where('anterior.nome', 'Feira 2026')
            ->where('anterior.saidas', 70)
            ->has('saidasCategoria'));

        $this->get(route('admin.painel', ['de' => '2027-10-15', 'ate' => '2027-10-15']))
            ->assertInertia(fn ($page) => $page->where('anterior', null));
    }

    public function test_painel_da_barraquinha_mostra_o_estoque_restante(): void
    {
        $barraquinha = $this->criarBarraquinha();
        $coxinha = $this->criarItem($barraquinha, 'Coxinha', 8.00, null, ['estoque_inicial' => 10]);
        $this->criarItem($barraquinha, 'Suco', 6.00);
        $user = $this->usuarioDa($barraquinha);
        $this->vender($user, 'feira', [$coxinha->id => 3]);

        $this->como($user)->get(route('barraquinha.painel'))->assertInertia(fn ($page) => $page
            ->has('estoque', 1)
            ->where('estoque.0.nome', 'Coxinha')
            ->where('estoque.0.vendidos', 3)
            ->where('estoque.0.restante', 7));
    }

    public function test_pendencias_do_sino_respeitam_o_perfil(): void
    {
        [$barraquinha] = $this->cenarioPastelaria();
        $user = $this->usuarioDa($barraquinha);

        $this->como($user)->getJson(route('barraquinha.pendencias'))->assertOk()->assertJsonStructure(['pendencias' => [['titulo', 'descricao', 'feito', 'href']]]);
        $this->como($user)->getJson(route('admin.pendencias'))->assertForbidden();
        $this->como($this->criarAdmin())->getJson(route('admin.pendencias'))->assertOk()->assertJsonStructure(['pendencias']);
    }
}
