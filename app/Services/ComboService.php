<?php

namespace App\Services;

use App\Enums\AcaoAuditoria;
use App\Enums\TipoDesconto;
use App\Models\AuditoriaLog;
use App\Models\Barraquinha;
use App\Models\Combo;
use App\Models\ComboItem;
use App\Models\Item;
use App\Services\Vendas\VendaService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ComboService
{
    public function __construct(private readonly VendaService $vendas) {}

    /**
     * @param  array{nome: string, tipo_desconto: string, valor: float|string, itens: array<int, int>, confirmar_sem_desconto?: bool}  $dados
     */
    public function salvar(Barraquinha $barraquinha, ?Combo $combo, array $dados): Combo
    {
        $this->vendas->garantirFeiraAberta($barraquinha);

        $composicao = $this->composicao($dados['itens'] ?? []);
        $tipo = TipoDesconto::from($dados['tipo_desconto']);
        $valor = round((float) $dados['valor'], 2);

        $itens = Item::withoutGlobalScopes()
            ->with('precos')
            ->where('barraquinha_id', $barraquinha->id)
            ->whereIn('id', array_keys($composicao))
            ->get()
            ->keyBy('id');

        $this->validar($barraquinha, $combo, $composicao, $itens, $tipo, $valor, (bool) ($dados['confirmar_sem_desconto'] ?? false));

        return DB::transaction(function () use ($barraquinha, $combo, $dados, $composicao, $tipo, $valor) {
            $novo = $combo === null;

            if ($novo) {
                $ultimo = Combo::withoutGlobalScopes()
                    ->where('barraquinha_id', $barraquinha->id)
                    ->orderByDesc('numero')
                    ->lockForUpdate()
                    ->value('numero');

                $combo = Combo::create([
                    'barraquinha_id' => $barraquinha->id,
                    'numero' => (int) $ultimo + 1,
                    'nome' => trim($dados['nome']),
                    'tipo_desconto' => $tipo,
                    'valor' => $valor,
                    'ativo' => true,
                ]);
            } else {
                $combo->update(['nome' => trim($dados['nome']), 'tipo_desconto' => $tipo, 'valor' => $valor]);
                ComboItem::withoutGlobalScopes()->where('combo_id', $combo->id)->delete();
            }

            foreach ($composicao as $itemId => $quantidade) {
                ComboItem::create([
                    'barraquinha_id' => $barraquinha->id,
                    'combo_id' => $combo->id,
                    'item_id' => $itemId,
                    'quantidade' => $quantidade,
                ]);
            }

            AuditoriaLog::registrar($novo ? AcaoAuditoria::ComboCriado : AcaoAuditoria::ComboAlterado, $combo, detalhe: [
                'numero' => $combo->numero,
                'composicao' => $composicao,
                'tipo_desconto' => $tipo->value,
                'valor' => $valor,
            ], barraquinhaId: $barraquinha->id);

            return $combo->load('itens.precos');
        });
    }

    public function alternarAtivo(Combo $combo): Combo
    {
        $this->vendas->garantirFeiraAberta($combo->barraquinha);
        $combo->load('itens');

        if (! $combo->ativo) {
            if ($combo->estaIncompleto()) {
                throw ValidationException::withMessages(['combo' => __('O combo tem itens inativos: edite a composição antes de reativar.')]);
            }
            $this->garantirComposicaoUnica($combo->barraquinha_id, $combo->id, $combo->composicao());
        }

        $combo->update(['ativo' => ! $combo->ativo]);
        AuditoriaLog::registrar(AcaoAuditoria::ComboAlterado, $combo, detalhe: ['ativo' => $combo->ativo], barraquinhaId: $combo->barraquinha_id);

        return $combo;
    }

    /** Combo que já teve vendas nunca é excluído: só desativado. */
    public function excluir(Combo $combo): void
    {
        $this->vendas->garantirFeiraAberta($combo->barraquinha);

        if ($combo->foiVendido()) {
            throw ValidationException::withMessages(['combo' => __('Este combo já teve vendas: desative-o em vez de excluir.')]);
        }

        AuditoriaLog::registrar(AcaoAuditoria::ComboExcluido, $combo, detalhe: ['numero' => $combo->numero, 'nome' => $combo->nome], barraquinhaId: $combo->barraquinha_id);
        $combo->delete();
    }

    /** @return array<int, int> item_id => quantidade (só os marcados, com quantidade ≥ 1) */
    private function composicao(array $itens): array
    {
        $composicao = [];
        foreach ($itens as $itemId => $quantidade) {
            if ((int) $quantidade > 0) {
                $composicao[(int) $itemId] = (int) $quantidade;
            }
        }
        ksort($composicao);

        return $composicao;
    }

    private function validar(Barraquinha $barraquinha, ?Combo $combo, array $composicao, $itens, TipoDesconto $tipo, float $valor, bool $confirmado): void
    {
        if (array_sum($composicao) < 2) {
            throw ValidationException::withMessages(['itens' => __('O combo precisa de pelo menos 2 itens (ou 2 unidades).')]);
        }

        // Itens primeiro, combos depois: só itens já cadastrados, ativos e da própria barraquinha.
        foreach (array_keys($composicao) as $itemId) {
            $item = $itens->get($itemId);
            if (! $item || ! $item->ativo) {
                throw ValidationException::withMessages(['itens' => __('Selecione apenas itens ativos desta barraquinha.')]);
            }
        }

        if ($tipo === TipoDesconto::Percentual && ($valor <= 0 || $valor >= 100)) {
            throw ValidationException::withMessages(['valor' => __('O percentual de desconto deve ficar entre 0 e 100.')]);
        }

        if ($tipo === TipoDesconto::PrecoFechado && $valor <= 0) {
            throw ValidationException::withMessages(['valor' => __('O preço do combo deve ser maior que zero.')]);
        }

        $somaAvulsa = 0.0;
        foreach ($composicao as $itemId => $quantidade) {
            $somaAvulsa += $itens[$itemId]->precoPara(\App\Enums\Canal::PADRAO) * $quantidade;
        }

        if (Combo::calcularPreco($tipo, $valor, $somaAvulsa) >= round($somaAvulsa, 2) && ! $confirmado) {
            throw ValidationException::withMessages(['confirmar_sem_desconto' => __(
                'O preço do combo não é menor que a soma avulsa (:soma): não há desconto. Confirme para salvar mesmo assim. O cliente nunca paga mais do que pagaria avulso, então um combo mais caro não é aplicado.',
                ['soma' => moeda($somaAvulsa)],
            )]);
        }

        $this->garantirComposicaoUnica($barraquinha->id, $combo?->id, $composicao);
    }

    private function garantirComposicaoUnica(int $barraquinhaId, ?int $ignorar, array $composicao): void
    {
        $duplicado = Combo::withoutGlobalScopes()
            ->with('itens')
            ->where('barraquinha_id', $barraquinhaId)
            ->ativos()
            ->when($ignorar, fn ($q) => $q->whereKeyNot($ignorar))
            ->get()
            ->first(fn (Combo $outro) => $outro->composicao() === $composicao);

        if ($duplicado) {
            throw ValidationException::withMessages(['itens' => __('Já existe um combo ativo com exatamente esta composição (:tag).', ['tag' => $duplicado->tag()])]);
        }
    }
}
