<?php

namespace App\Services\Vendas;

use App\Models\VendaLinha;

class ClassificadorVenda
{
    private const ORCAMENTO_DE_NOS = 50_000;

    private array $combos = [];

    private array $ordem = [];

    private array $tetos = [];

    private int $nos = 0;

    private ?array $melhorSolucao = null;

    private ?array $alvo = null;

    public function classificar(array $carrinho, array $itens, array $combos): ResultadoClassificacao
    {
        $carrinho = array_filter(array_map('intval', $carrinho), fn ($q) => $q > 0);
        $precos = array_map(fn ($i) => (int) round($i['preco'] * 100), $itens);

        $this->combos = [];
        foreach ($combos as $combo) {
            $avulso = 0;
            foreach ($combo['composicao'] as $itemId => $qtd) {
                $avulso += ($precos[$itemId] ?? 0) * $qtd;
            }
            $preco = (int) round($combo['preco'] * 100);

            if ($combo['composicao'] && $preco <= $avulso) {
                $this->combos[] = [...$combo, 'preco' => $preco, 'desconto' => $avulso - $preco, 'unidades' => array_sum($combo['composicao'])];
            }
        }
        usort($this->combos, fn ($a, $b) => $a['numero'] <=> $b['numero']);

        [, , $quantidades] = $this->melhor($carrinho);

        $linhas = [];
        $restante = $carrinho;
        foreach ($quantidades as $i => $vezes) {
            if ($vezes === 0) {
                continue;
            }
            $combo = $this->combos[$i];
            foreach ($combo['composicao'] as $itemId => $qtd) {
                $restante[$itemId] -= $qtd * $vezes;
            }
            $linhas[] = new LinhaClassificada(
                tag: VendaLinha::TAG_COMBO,
                descricao: $combo['nome'],
                quantidade: $vezes,
                precoUnitario: $combo['preco'],
                descontoUnitario: $combo['desconto'],
                comboId: $combo['id'],
                comboNumero: $combo['numero'],
                componentes: $combo['composicao'],
            );
        }

        foreach ($restante as $itemId => $qtd) {
            if ($qtd > 0) {
                $linhas[] = new LinhaClassificada(
                    tag: VendaLinha::TAG_COMUM,
                    descricao: $itens[$itemId]['nome'] ?? (string) $itemId,
                    quantidade: $qtd,
                    precoUnitario: $precos[$itemId] ?? 0,
                    descontoUnitario: 0,
                    itemId: $itemId,
                    componentes: [$itemId => 1],
                );
            }
        }

        return new ResultadoClassificacao($linhas);
    }

    private function melhor(array $restante): array
    {
        $total = count($this->combos);
        $zerado = array_fill(0, $total, 0);

        $porEficiencia = array_keys($this->combos);
        usort($porEficiencia, fn ($a, $b) => $this->combos[$b]['desconto'] * $this->combos[$a]['unidades'] <=> $this->combos[$a]['desconto'] * $this->combos[$b]['unidades'] ?: $a <=> $b);

        $this->prepararOrdem($porEficiencia);
        $this->melhorSolucao = null;
        $this->buscar(0, $restante, 0, 0, $zerado, primeiraFase: true);
        $otimo = $this->melhorSolucao ?? [0, 0, $zerado];

        $this->prepararOrdem(array_keys($this->combos));
        $this->melhorSolucao = null;
        $this->alvo = $otimo;
        $this->buscar(0, $restante, 0, 0, $zerado, primeiraFase: false);
        $this->alvo = null;

        return $this->melhorSolucao ?? $otimo;
    }

    private function prepararOrdem(array $ordem): void
    {
        $this->ordem = $ordem;
        $this->nos = 0;
        $this->tetos = [count($ordem) => []];
        $teto = [];
        for ($p = count($ordem) - 1; $p >= 0; $p--) {
            $combo = $this->combos[$ordem[$p]];
            foreach ($combo['composicao'] as $itemId => $qtd) {
                $teto[$itemId] = max($teto[$itemId] ?? 0, $combo['desconto'] / $combo['unidades']);
            }
            $this->tetos[$p] = $teto;
        }
    }

    private function buscar(int $posicao, array $restante, int $desconto, int $cobertas, array $vezesPorCombo, bool $primeiraFase): bool
    {
        if ($posicao >= count($this->ordem)) {
            if ($primeiraFase) {
                if ($this->melhorSolucao === null || [$desconto, $cobertas] > [$this->melhorSolucao[0], $this->melhorSolucao[1]]) {
                    $this->melhorSolucao = [$desconto, $cobertas, $vezesPorCombo];
                }

                return false;
            }

            if ([$desconto, $cobertas] >= [$this->alvo[0], $this->alvo[1]]) {
                $this->melhorSolucao = [$desconto, $cobertas, $vezesPorCombo];

                return true;
            }

            return false;
        }

        $referencia = $primeiraFase ? $this->melhorSolucao : $this->alvo;
        if ($referencia !== null && ++$this->nos > self::ORCAMENTO_DE_NOS) {
            return ! $primeiraFase;
        }

        $indice = $this->ordem[$posicao];
        $combo = $this->combos[$indice];
        $cabem = PHP_INT_MAX;
        foreach ($combo['composicao'] as $itemId => $qtd) {
            $cabem = min($cabem, intdiv($restante[$itemId] ?? 0, max(1, $qtd)));
        }

        for ($vezes = $cabem; $vezes >= 0; $vezes--) {
            $proximo = $restante;
            foreach ($combo['composicao'] as $itemId => $qtd) {
                $proximo[$itemId] = ($proximo[$itemId] ?? 0) - $qtd * $vezes;
            }
            $novoDesconto = $desconto + $combo['desconto'] * $vezes;
            $novasCobertas = $cobertas + $combo['unidades'] * $vezes;

            if ($referencia !== null) {
                [$limiteDesconto, $limiteCobertas] = $this->limite($posicao + 1, $proximo, $novoDesconto, $novasCobertas);
                $descartar = $primeiraFase
                    ? [$limiteDesconto, $limiteCobertas] <= [$referencia[0], $referencia[1]]
                    : [$limiteDesconto, $limiteCobertas] < [$referencia[0], $referencia[1]];

                if ($descartar) {
                    if ($primeiraFase) {
                        break;
                    }

                    continue;
                }
            }

            $vezesPorCombo[$indice] = $vezes;
            if ($this->buscar($posicao + 1, $proximo, $novoDesconto, $novasCobertas, $vezesPorCombo, $primeiraFase)) {
                return true;
            }
            $referencia = $primeiraFase ? $this->melhorSolucao : $this->alvo;
        }

        return false;
    }

    private function limite(int $posicao, array $restante, int $desconto, int $cobertas): array
    {
        foreach ($this->tetos[$posicao] as $itemId => $porUnidade) {
            $qtd = $restante[$itemId] ?? 0;
            $desconto += $qtd * $porUnidade;
            $cobertas += $qtd;
        }

        return [(int) floor($desconto + 1e-6), $cobertas];
    }
}
