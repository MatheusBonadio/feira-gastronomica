<?php

namespace App\Services;

use App\Enums\AcaoAuditoria;
use App\Enums\BarraquinhaStatus;
use App\Enums\FeiraStatus;
use App\Models\AuditoriaLog;
use App\Models\Barraquinha;
use App\Models\Feira;
use App\Models\Item;
use App\Models\ItemPreco;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FeiraService
{
    public function criar(array $dados): Feira
    {
        return DB::transaction(function () use ($dados) {
            $feira = Feira::create([...$this->campos($dados), 'qtd_barraquinhas' => 0]);
            $this->ajustarQuantidade($feira, (int) $dados['qtd_barraquinhas']);

            AuditoriaLog::registrar(AcaoAuditoria::FeiraCriada, $feira, detalhe: ['nome' => $feira->nome, 'vagas' => $feira->qtd_barraquinhas]);

            return $feira;
        });
    }

    public function atualizar(Feira $feira, array $dados): Feira
    {
        return DB::transaction(function () use ($feira, $dados) {
            $antes = $feira->only(['nome', 'status', 'qtd_barraquinhas']);
            $feira->update($this->campos($dados));
            $this->ajustarQuantidade($feira, (int) $dados['qtd_barraquinhas']);

            AuditoriaLog::registrar(AcaoAuditoria::FeiraAlterada, $feira, detalhe: [
                'antes' => $antes,
                'depois' => $feira->fresh()->only(array_keys($antes)),
            ]);

            return $feira;
        });
    }

    /**
     * Aumentar cria vagas em branco. Reduzir remove primeiro as vagas vazias e
     * depois barraquinhas sem vendas, das últimas posições para as primeiras;
     * nunca fica abaixo do número de barraquinhas que já têm vendas.
     */
    public function ajustarQuantidade(Feira $feira, int $quantidade): void
    {
        $barraquinhas = $feira->barraquinhas()->withCount('vendas')->get();
        $atual = $barraquinhas->count();

        if ($quantidade > $atual) {
            $proxima = (int) $barraquinhas->max('posicao');
            for ($i = $atual; $i < $quantidade; $i++) {
                Barraquinha::create(['feira_id' => $feira->id, 'posicao' => ++$proxima, 'status' => BarraquinhaStatus::Ativa]);
            }
        }

        if ($quantidade < $atual) {
            $comVendas = $barraquinhas->where('vendas_count', '>', 0)->count();
            if ($quantidade < $comVendas) {
                throw ValidationException::withMessages(['qtd_barraquinhas' => __(
                    'Não é possível reduzir para :n: :com barraquinhas já têm vendas.',
                    ['n' => $quantidade, 'com' => $comVendas],
                )]);
            }

            $removiveis = $barraquinhas
                ->where('vendas_count', 0)
                ->sortBy([fn ($a, $b) => $b->ehVaga() <=> $a->ehVaga(), fn ($a, $b) => $b->posicao <=> $a->posicao])
                ->take($atual - $quantidade);

            Barraquinha::whereIn('id', $removiveis->pluck('id'))->delete();
        }

        $feira->update(['qtd_barraquinhas' => $quantidade]);
    }

    public function encerrar(Feira $feira): void
    {
        $feira->update(['status' => FeiraStatus::Encerrada]);
        AuditoriaLog::registrar(AcaoAuditoria::FeiraEncerrada, $feira);
    }

    public function reabrir(Feira $feira): void
    {
        $feira->update(['status' => FeiraStatus::Aberta]);
        AuditoriaLog::registrar(AcaoAuditoria::FeiraReaberta, $feira);
    }

    /** Copia barraquinhas e itens (com preços) para agilizar a próxima edição. Vendas, combos e logins não vêm junto. */
    public function duplicar(Feira $origem, array $dados): Feira
    {
        return DB::transaction(function () use ($origem, $dados) {
            $nova = Feira::create([
                ...$this->campos($dados),
                'status' => FeiraStatus::Planejada,
                'qtd_barraquinhas' => $origem->qtd_barraquinhas,
            ]);

            foreach ($origem->barraquinhas()->with('itens.precos')->get() as $barraquinha) {
                $copia = Barraquinha::create([
                    'feira_id' => $nova->id,
                    ...$barraquinha->only(['posicao', 'nome', 'responsaveis', 'meta_vendas']),
                    'status' => BarraquinhaStatus::Ativa,
                ]);

                foreach ($barraquinha->itens as $item) {
                    $novoItem = Item::create([
                        'barraquinha_id' => $copia->id,
                        ...$item->only(['categoria_id', 'nome', 'descricao', 'custo', 'estoque_inicial', 'ativo']),
                    ]);
                    foreach ($item->precos as $preco) {
                        ItemPreco::create(['barraquinha_id' => $copia->id, 'item_id' => $novoItem->id, 'canal' => $preco->canal, 'preco' => $preco->preco]);
                    }
                }
            }

            AuditoriaLog::registrar(AcaoAuditoria::FeiraDuplicada, $nova, detalhe: ['origem' => $origem->id]);

            return $nova;
        });
    }

    private function campos(array $dados): array
    {
        return array_filter([
            'nome' => $dados['nome'] ?? null,
            'data_inicio' => $dados['data_inicio'] ?? null,
            'data_fim' => $dados['data_fim'] ?? null,
            'status' => $dados['status'] ?? null,
        ], fn ($v) => $v !== null);
    }
}
