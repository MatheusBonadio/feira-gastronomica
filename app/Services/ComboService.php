<?php

namespace App\Services;

use App\Enums\AcaoAuditoria;
use App\Enums\Canal;
use App\Enums\TipoDesconto;
use App\Models\AuditoriaLog;
use App\Models\Barraquinha;
use App\Models\Combo;
use App\Models\ComboCanal;
use App\Models\ComboItem;
use App\Models\Item;
use App\Services\Vendas\VendaService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ComboService
{
    public function __construct(private readonly VendaService $vendas) {}

    public function salvar(Barraquinha $barraquinha, ?Combo $combo, array $dados): Combo
    {
        $this->vendas->garantirFeiraAberta($barraquinha);

        $composicao = $this->composicao($dados['itens'] ?? []);
        $regras = $this->regras($dados['canais'] ?? []);

        $itens = Item::withoutGlobalScopes()
            ->with('precos')
            ->where('barraquinha_id', $barraquinha->id)
            ->whereIn('id', array_keys($composicao))
            ->get()
            ->keyBy('id');

        $this->validar($barraquinha, $combo, $composicao, $itens, $regras, (bool) ($dados['confirmar_sem_desconto'] ?? false));

        return DB::transaction(function () use ($barraquinha, $combo, $dados, $composicao, $regras) {
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
                    'ativo' => true,
                ]);
            } else {
                $combo->update(['nome' => trim($dados['nome'])]);
                ComboItem::withoutGlobalScopes()->where('combo_id', $combo->id)->delete();
                ComboCanal::withoutGlobalScopes()->where('combo_id', $combo->id)->delete();
            }

            foreach ($composicao as $itemId => $quantidade) {
                ComboItem::create([
                    'barraquinha_id' => $barraquinha->id,
                    'combo_id' => $combo->id,
                    'item_id' => $itemId,
                    'quantidade' => $quantidade,
                ]);
            }

            foreach ($regras as $regra) {
                ComboCanal::create([
                    'barraquinha_id' => $barraquinha->id,
                    'combo_id' => $combo->id,
                    'canal' => $regra['canal'],
                    'tipo_desconto' => $regra['tipo'],
                    'valor' => $regra['valor'],
                ]);
            }

            AuditoriaLog::registrar($novo ? AcaoAuditoria::ComboCriado : AcaoAuditoria::ComboAlterado, $combo, detalhe: [
                'numero' => $combo->numero,
                'composicao' => $composicao,
                'canais' => array_map(fn (array $r) => ['tipo_desconto' => $r['tipo']->value, 'valor' => $r['valor']], $regras),
            ], barraquinhaId: $barraquinha->id);

            return $combo->load(['itens.precos', 'canais']);
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

    public function excluir(Combo $combo): void
    {
        $this->vendas->garantirFeiraAberta($combo->barraquinha);

        if ($combo->foiVendido()) {
            throw ValidationException::withMessages(['combo' => __('Este combo já teve vendas: desative-o em vez de excluir.')]);
        }

        AuditoriaLog::registrar(AcaoAuditoria::ComboExcluido, $combo, detalhe: ['numero' => $combo->numero, 'nome' => $combo->nome], barraquinhaId: $combo->barraquinha_id);
        $combo->delete();
    }

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

    /** @return array<string, array{canal: Canal, tipo: TipoDesconto, valor: float}> canais marcados, pela ordem dos canais */
    private function regras(array $canais): array
    {
        $regras = [];
        foreach (Canal::cases() as $canal) {
            $dados = $canais[$canal->value] ?? [];
            if (! empty($dados['ativo'])) {
                $regras[$canal->value] = [
                    'canal' => $canal,
                    'tipo' => TipoDesconto::from($dados['tipo_desconto']),
                    'valor' => round((float) $dados['valor'], 2),
                ];
            }
        }

        return $regras;
    }

    private function validar(Barraquinha $barraquinha, ?Combo $combo, array $composicao, $itens, array $regras, bool $confirmado): void
    {
        if (array_sum($composicao) < 2) {
            throw ValidationException::withMessages(['itens' => __('O combo precisa de pelo menos 2 itens (ou 2 unidades).')]);
        }

        foreach (array_keys($composicao) as $itemId) {
            $item = $itens->get($itemId);
            if (! $item || ! $item->ativo) {
                throw ValidationException::withMessages(['itens' => __('Selecione apenas itens ativos desta barraquinha.')]);
            }
        }

        if ($regras === []) {
            throw ValidationException::withMessages(['canais' => __('Marque ao menos um canal em que o combo vale.')]);
        }

        $semDesconto = [];
        foreach ($regras as $chave => ['canal' => $canal, 'tipo' => $tipo, 'valor' => $valor]) {
            if ($tipo === TipoDesconto::Percentual && ($valor <= 0 || $valor >= 100)) {
                throw ValidationException::withMessages(["canais.{$chave}.valor" => __('O percentual de desconto deve ficar entre 0 e 100.')]);
            }

            if ($tipo === TipoDesconto::PrecoFechado && $valor <= 0) {
                throw ValidationException::withMessages(["canais.{$chave}.valor" => __('O preço do combo deve ser maior que zero.')]);
            }

            $somaAvulsa = 0.0;
            foreach ($composicao as $itemId => $quantidade) {
                $somaAvulsa += $itens[$itemId]->precoPara($canal) * $quantidade;
            }

            if (Combo::calcularPreco($tipo, $valor, $somaAvulsa) >= round($somaAvulsa, 2)) {
                $semDesconto[] = __(':canal (soma avulsa :soma)', ['canal' => $canal->label(), 'soma' => moeda($somaAvulsa)]);
            }
        }

        if ($semDesconto !== [] && ! $confirmado) {
            throw ValidationException::withMessages(['confirmar_sem_desconto' => __(
                'Sem desconto em :canais: o preço do combo não é menor que a soma avulsa. Confirme para salvar mesmo assim. O cliente nunca paga mais do que pagaria avulso, então um combo mais caro não é aplicado.',
                ['canais' => implode(', ', $semDesconto)],
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
