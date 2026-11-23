<?php

namespace App\Services;

use App\Enums\AcaoAuditoria;
use App\Enums\LancamentoCategoria;
use App\Models\AuditoriaLog;
use App\Models\Barraquinha;
use App\Models\Lancamento;
use App\Models\User;
use App\Services\Vendas\VendaService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class LancamentoService
{
    private const DISCO = 'local';

    public function __construct(private readonly VendaService $vendas) {}

    public function criar(Barraquinha $barraquinha, User $autor, array $dados, ?UploadedFile $comprovante = null): Lancamento
    {
        $this->vendas->garantirFeiraAberta($barraquinha);

        $lancamento = Lancamento::create([
            ...$this->campos($dados),
            'barraquinha_id' => $barraquinha->id,
            'criado_por' => $autor->id,
            'comprovante_path' => $comprovante ? $this->guardar($barraquinha, $comprovante) : null,
        ]);

        AuditoriaLog::registrar(AcaoAuditoria::LancamentoCriado, $lancamento, detalhe: $this->resumo($lancamento), barraquinhaId: $barraquinha->id);

        return $lancamento;
    }

    public function atualizar(Lancamento $lancamento, array $dados, ?UploadedFile $comprovante = null): Lancamento
    {
        $this->vendas->garantirFeiraAberta($lancamento->barraquinha);
        $antes = $this->resumo($lancamento);

        $campos = $this->campos($dados);
        $comprovanteAnterior = $lancamento->comprovante_path;
        if ($comprovante) {
            $campos['comprovante_path'] = $this->guardar($lancamento->barraquinha, $comprovante);
        }
        $lancamento->update($campos);

        if ($comprovante && $comprovanteAnterior && $comprovanteAnterior !== $lancamento->comprovante_path) {
            Storage::disk(self::DISCO)->delete($comprovanteAnterior);
        }

        AuditoriaLog::registrar(AcaoAuditoria::LancamentoAlterado, $lancamento, detalhe: [
            'antes' => $antes,
            'depois' => $this->resumo($lancamento),
        ], barraquinhaId: $lancamento->barraquinha_id);

        return $lancamento;
    }

    public function excluir(Lancamento $lancamento): void
    {
        $this->vendas->garantirFeiraAberta($lancamento->barraquinha);

        AuditoriaLog::registrar(AcaoAuditoria::LancamentoExcluido, $lancamento, detalhe: $this->resumo($lancamento), barraquinhaId: $lancamento->barraquinha_id);
        $lancamento->delete();
    }

    public function caminhoComprovante(Lancamento $lancamento): ?string
    {
        return $lancamento->comprovante_path && Storage::disk(self::DISCO)->exists($lancamento->comprovante_path)
            ? Storage::disk(self::DISCO)->path($lancamento->comprovante_path)
            : null;
    }

    private function campos(array $dados): array
    {
        $categoria = LancamentoCategoria::from($dados['categoria']);

        return [
            'tipo' => $categoria->tipo(),
            'categoria' => $categoria,
            'descricao' => trim($dados['descricao']),
            'valor' => round((float) $dados['valor'], 2),
            'data' => $dados['data'],
        ];
    }

    private function guardar(Barraquinha $barraquinha, UploadedFile $arquivo): string
    {
        return $arquivo->store("comprovantes/{$barraquinha->id}", self::DISCO);
    }

    private function resumo(Lancamento $lancamento): array
    {
        return [
            'categoria' => $lancamento->categoria->value,
            'descricao' => $lancamento->descricao,
            'valor' => (float) $lancamento->valor,
            'data' => $lancamento->data?->toDateString(),
        ];
    }
}
