<?php

namespace Tests\Feature;

use App\Enums\LancamentoCategoria;
use App\Models\Lancamento;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LancamentoTest extends TestCase
{
    public function test_trocar_o_comprovante_apaga_o_arquivo_anterior(): void
    {
        Storage::fake('local');
        $barraquinha = $this->criarBarraquinha();
        $usuario = $this->usuarioDa($barraquinha);
        $dados = ['categoria' => LancamentoCategoria::Mercadoria->value, 'descricao' => 'Gás', 'valor' => 90, 'data' => '2027-10-15'];

        $this->actingAs($usuario)->post(route('barraquinha.lancamentos.store'), [
            ...$dados, 'comprovante' => UploadedFile::fake()->create('errada.pdf', 10, 'application/pdf'),
        ])->assertRedirect();
        $lancamento = Lancamento::withoutGlobalScopes()->sole();
        $anterior = $lancamento->comprovante_path;

        $this->actingAs($usuario)->put(route('barraquinha.lancamentos.update', $lancamento), [
            ...$dados, 'comprovante' => UploadedFile::fake()->create('certa.pdf', 10, 'application/pdf'),
        ])->assertRedirect();

        $atual = $lancamento->fresh()->comprovante_path;
        $this->assertNotSame($anterior, $atual);
        Storage::disk('local')->assertMissing($anterior);
        Storage::disk('local')->assertExists($atual);
    }

    public function test_editar_sem_enviar_comprovante_mantem_o_arquivo(): void
    {
        Storage::fake('local');
        $barraquinha = $this->criarBarraquinha();
        $usuario = $this->usuarioDa($barraquinha);
        $dados = ['categoria' => LancamentoCategoria::Mercadoria->value, 'descricao' => 'Gás', 'valor' => 90, 'data' => '2027-10-15'];

        $this->actingAs($usuario)->post(route('barraquinha.lancamentos.store'), [
            ...$dados, 'comprovante' => UploadedFile::fake()->create('nota.pdf', 10, 'application/pdf'),
        ])->assertRedirect();
        $lancamento = Lancamento::withoutGlobalScopes()->sole();

        $this->actingAs($usuario)->put(route('barraquinha.lancamentos.update', $lancamento), [...$dados, 'valor' => 95])->assertRedirect();

        $this->assertSame($lancamento->comprovante_path, $lancamento->fresh()->comprovante_path);
        Storage::disk('local')->assertExists($lancamento->comprovante_path);
    }
}
