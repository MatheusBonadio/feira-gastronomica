<?php

namespace App\Services\Vendas;

use App\Models\VendaLinha;

class ClassificadorVenda
{
    private array $memo = [];

    private array $combos = [];

    public function classificar(array $carrinho, array $itens, array $combos): ResultadoClassificacao
    {
        $carrinho = array_filter(array_map('intval', $carrinho), fn ($q) => $q > 0);
        $precos = array_map(fn ($i) => (int) round($i['preco'] * 100), $itens);

        $this->memo = [];
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

        [, , $quantidades] = $this->melhor(0, $carrinho);

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

    private function melhor(int $indice, array $restante): array
    {
        if ($indice >= count($this->combos)) {
            return [0, 0, []];
        }

        ksort($restante);
        $chave = $indice.'|'.json_encode($restante);
        if (isset($this->memo[$chave])) {
            return $this->memo[$chave];
        }

        $combo = $this->combos[$indice];
        $cabem = PHP_INT_MAX;
        foreach ($combo['composicao'] as $itemId => $qtd) {
            $cabem = min($cabem, intdiv($restante[$itemId] ?? 0, max(1, $qtd)));
        }

        $melhor = null;
        for ($vezes = $cabem; $vezes >= 0; $vezes--) {
            $proximo = $restante;
            foreach ($combo['composicao'] as $itemId => $qtd) {
                if ($vezes > 0) {
                    $proximo[$itemId] -= $qtd * $vezes;
                }
            }

            [$desconto, $cobertas, $resto] = $this->melhor($indice + 1, $proximo);
            $candidato = [$desconto + $combo['desconto'] * $vezes, $cobertas + $combo['unidades'] * $vezes, [$vezes, ...$resto]];

            if ($melhor === null || $candidato[0] > $melhor[0] || ($candidato[0] === $melhor[0] && $candidato[1] > $melhor[1])) {
                $melhor = $candidato;
            }
        }

        return $this->memo[$chave] = $melhor;
    }
}
