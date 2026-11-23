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

    public function ajustarQuantidade(Feira $feira, int $quantidade): void
    {
        $semEscopo = fn ($q) => $q->withoutGlobalScopes();
        $barraquinhas = $feira->barraquinhas()
            ->withCount(['vendas' => $semEscopo, 'lancamentos' => $semEscopo, 'itens' => $semEscopo, 'combos' => $semEscopo])
            ->withExists('usuario')
            ->get();
        $atual = $barraquinhas->count();

        if ($quantidade > $atual) {
            $proxima = (int) $barraquinhas->max('posicao');
            for ($i = $atual; $i < $quantidade; $i++) {
                Barraquinha::create(['feira_id' => $feira->id, 'posicao' => ++$proxima, 'status' => BarraquinhaStatus::Ativa]);
            }
        }

        if ($quantidade < $atual) {
            [$removiveis, $emUso] = $barraquinhas->partition(fn (Barraquinha $b) => $this->podeRemover($b));
            if ($quantidade < $emUso->count()) {
                throw ValidationException::withMessages(['qtd_barraquinhas' => __(
                    'Não é possível reduzir para :n: :com barraquinhas já têm vendas, lançamentos, itens, combos ou acesso.',
                    ['n' => $quantidade, 'com' => $emUso->count()],
                )]);
            }

            $removiveis = $removiveis
                ->sortBy([fn ($a, $b) => $b->ehVaga() <=> $a->ehVaga(), fn ($a, $b) => $b->posicao <=> $a->posicao])
                ->take($atual - $quantidade);

            Barraquinha::whereIn('id', $removiveis->pluck('id'))->delete();
        }

        $feira->update(['qtd_barraquinhas' => $quantidade]);
    }

    private function podeRemover(Barraquinha $barraquinha): bool
    {
        return ! $barraquinha->usuario_exists
            && $barraquinha->vendas_count === 0
            && $barraquinha->lancamentos_count === 0
            && $barraquinha->itens_count === 0
            && $barraquinha->combos_count === 0;
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
