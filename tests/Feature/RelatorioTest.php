<?php

namespace Tests\Feature;

use App\Enums\Canal;
use App\Enums\FormaPagamento;
use App\Enums\LancamentoCategoria;
use App\Enums\LancamentoTipo;
use App\Models\Lancamento;
use App\Services\Vendas\VendaService;
use Tests\TestCase;

class RelatorioTest extends TestCase
{
    public function test_barraquinha_exporta_so_os_proprios_dados_mesmo_pedindo_outra(): void
    {
        $feira = $this->criarFeira();
        [$minha, $pastel] = $this->cenarioPastelaria($feira);
        $outra = $this->criarBarraquinha($feira, 'Outra Barraquinha');
        $itemOutra = $this->criarItem($outra, 'Produto secreto', 77);
        $vendas = app(VendaService::class);
        $usuarioMinha = $this->usuarioDa($minha);
        $vendas->registrar($minha, $usuarioMinha, Canal::Feira, FormaPagamento::Pix, [$pastel->id => 1]);
        $vendas->registrar($outra, $this->usuarioDa($outra), Canal::Feira, FormaPagamento::Pix, [$itemOutra->id => 1]);

        $resposta = $this->actingAs($usuarioMinha)
            ->get(route('barraquinha.relatorios.exportar', [
                'tipo' => 'vendas_detalhadas', 'formato' => 'csv', 'barraquinhas' => [$outra->id],
            ]));

        $resposta->assertOk();
        $csv = $resposta->streamedContent();
        $this->assertStringContainsString('Pastel de carne', $csv);
        $this->assertStringNotContainsString('Produto secreto', $csv);
        $this->assertStringNotContainsString('Outra Barraquinha', $csv);
        $this->assertDatabaseHas('auditoria_logs', ['acao' => 'exportacao']);
    }

    public function test_comparativo_e_exclusivo_do_admin(): void
    {
        [$barraquinha] = $this->cenarioPastelaria();

        $this->actingAs($this->usuarioDa($barraquinha))
            ->get(route('barraquinha.relatorios.exportar', ['tipo' => 'comparativo', 'formato' => 'csv']))
            ->assertForbidden();
    }

    public function test_admin_exporta_fechamento_em_xlsx_e_pdf(): void
    {
        $feira = $this->criarFeira();
        [$barraquinha, $pastel] = $this->cenarioPastelaria($feira);
        $this->criarBarraquinha($feira, 'Segunda');
        app(VendaService::class)->registrar($barraquinha, $this->usuarioDa($barraquinha), Canal::Feira, FormaPagamento::Pix, [$pastel->id => 1]);
        $admin = $this->criarAdmin();

        $xlsx = $this->actingAs($admin)->get(route('admin.relatorios.exportar', ['tipo' => 'fechamento', 'formato' => 'xlsx', 'feira_id' => $feira->id]));
        $xlsx->assertOk();
        $this->assertStringContainsString('spreadsheetml', $xlsx->headers->get('content-type'));

        $zip = new \ZipArchive;
        $zip->open($xlsx->getFile()->getPathname());
        $this->assertSame(3, preg_match_all('/<sheet /', $zip->getFromName('xl/workbook.xml')));
        $zip->close();

        $pdf = $this->actingAs($admin)->get(route('admin.relatorios.exportar', ['tipo' => 'comparativo', 'formato' => 'pdf', 'feira_id' => $feira->id]));
        $pdf->assertOk();
        $this->assertSame('application/pdf', $pdf->headers->get('content-type'));
    }

    public function test_csv_neutraliza_formulas_mas_mantem_numeros_negativos(): void
    {
        $feira = $this->criarFeira();
        [$barraquinha, $pastel] = $this->cenarioPastelaria($feira);
        app(VendaService::class)->registrar($barraquinha, $this->usuarioDa($barraquinha), Canal::Feira, FormaPagamento::Pix, [$pastel->id => 1]);
        foreach (['=1+1', '+SOMA(A1)', '@HOJE()', '-2+3', 'Gás de cozinha'] as $descricao) {
            $this->lancamento($barraquinha, $descricao, 100);
        }

        $admin = $this->criarAdmin();
        $csv = $this->actingAs($admin)
            ->get(route('admin.relatorios.exportar', ['tipo' => 'entradas_saidas', 'formato' => 'csv', 'feira_id' => $feira->id]))
            ->assertOk()->streamedContent();

        foreach (["'=1+1", "'+SOMA(A1)", "'@HOJE()", "'-2+3", ';"Gás de cozinha";'] as $esperado) {
            $this->assertStringContainsString($esperado, $csv);
        }
        $this->assertDoesNotMatchRegularExpression('/(^|;)"?[=+@]/m', $csv);

        $comparativo = $this->actingAs($admin)
            ->get(route('admin.relatorios.exportar', ['tipo' => 'comparativo', 'formato' => 'csv', 'feira_id' => $feira->id]))
            ->assertOk()->streamedContent();

        $this->assertMatchesRegularExpression('/;-[\d.,]+%;/', $comparativo);
        $this->assertStringNotContainsString("'-", $comparativo);
    }

    public function test_xlsx_continua_valido_com_caracteres_de_controle_no_texto(): void
    {
        $barraquinha = $this->criarBarraquinha();
        $this->lancamento($barraquinha, "Colado do WhatsApp \x0B\x01 fim", 10);

        $xlsx = $this->actingAs($this->usuarioDa($barraquinha))
            ->get(route('barraquinha.relatorios.exportar', ['tipo' => 'entradas_saidas', 'formato' => 'xlsx']))
            ->assertOk();

        $zip = new \ZipArchive;
        $zip->open($xlsx->getFile()->getPathname());
        $planilha = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        $this->assertNotFalse(simplexml_load_string($planilha, options: LIBXML_NOERROR));
        $this->assertStringContainsString('Colado do WhatsApp  fim', $planilha);
    }

    public function test_xlsx_nao_repete_nome_de_aba_nem_mudando_maiusculas(): void
    {
        $feira = $this->criarFeira();
        $this->criarBarraquinha($feira, 'consolidado');
        $this->criarBarraquinha($feira, "'Aspas'");

        $xlsx = $this->actingAs($this->criarAdmin())
            ->get(route('admin.relatorios.exportar', ['tipo' => 'fechamento', 'formato' => 'xlsx', 'feira_id' => $feira->id]))
            ->assertOk();

        $zip = new \ZipArchive;
        $zip->open($xlsx->getFile()->getPathname());
        preg_match_all('/<sheet name="([^"]+)"/', $zip->getFromName('xl/workbook.xml'), $abas);
        $zip->close();

        $this->assertSame(['Consolidado', 'consolidado (2)', 'Aspas'], array_map(fn ($n) => html_entity_decode($n, ENT_QUOTES | ENT_XML1), $abas[1]));
    }

    private function lancamento($barraquinha, string $descricao, float $valor): void
    {
        Lancamento::create([
            'barraquinha_id' => $barraquinha->id, 'tipo' => LancamentoTipo::Saida, 'categoria' => LancamentoCategoria::Mercadoria,
            'descricao' => $descricao, 'valor' => $valor, 'data' => '2027-10-15',
        ]);
    }
}
