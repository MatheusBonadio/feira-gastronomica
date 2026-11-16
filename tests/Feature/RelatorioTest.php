<?php

namespace Tests\Feature;

use App\Enums\Canal;
use App\Enums\FormaPagamento;
use App\Services\Vendas\VendaService;
use Tests\TestCase;

/** Seção 9: exportação em xlsx, csv e pdf, com escopo decidido no servidor e auditoria. */
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

        // Uma aba por barraquinha e uma de consolidado.
        $zip = new \ZipArchive;
        $zip->open($xlsx->getFile()->getPathname());
        $this->assertSame(3, preg_match_all('/<sheet /', $zip->getFromName('xl/workbook.xml')));
        $zip->close();

        $pdf = $this->actingAs($admin)->get(route('admin.relatorios.exportar', ['tipo' => 'comparativo', 'formato' => 'pdf', 'feira_id' => $feira->id]));
        $pdf->assertOk();
        $this->assertSame('application/pdf', $pdf->headers->get('content-type'));
    }
}
