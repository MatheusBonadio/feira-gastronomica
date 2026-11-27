<?php

namespace Database\Seeders;

use App\Enums\BarraquinhaStatus;
use App\Enums\Canal;
use App\Enums\FeiraStatus;
use App\Enums\FormaPagamento;
use App\Enums\LancamentoCategoria;
use App\Enums\VendaStatus;
use App\Models\Barraquinha;
use App\Models\Feira;
use App\Models\Lancamento;
use App\Models\Venda;
use App\Models\VendaLinha;
use Illuminate\Database\Seeder;

class Feira2026Seeder extends Seeder
{
    public const RELATORIO = [
        'Petisquim' => [35219.58, 18169.57, 5481.39],
        'Bigas' => [18407.90, 10938.30, 6002.46],
        'Pizzarito' => [17757.00, 10676.40, 5886.78],
        'Frango Supremo' => [15696.58, 14517.86, 4350.00],
        'Senhor dos Pastéis' => [14023.65, 7656.07, 4370.33],
        'Copitos' => [13289.70, 7243.15, 3249.10],
        'CrepeUna' => [10757.95, 6000.00, 1492.17],
        'Mundo Fritas' => [10192.23, 6678.20, 3049.78],
        'Chama no Espeto' => [10130.50, 6933.72, 1121.60],
        'Churros do Madruga' => [10069.48, 6513.83, 1197.82],
        'Entre Chocolates' => [8628.10, 9775.17, 1194.22],
    ];

    private const CANAIS_PETISQUIM = ['pre_venda' => 24412.44, 'feira' => 6027.14];

    public function run(): void
    {
        $feira = Feira::create([
            'nome' => 'Feira Gastronômica 2026',
            'data_inicio' => '2026-10-16',
            'data_fim' => '2026-10-17',
            'data_corte_pre_venda' => '2026-10-15 23:59:00',
            'status' => FeiraStatus::Encerrada,
            'qtd_barraquinhas' => count(self::RELATORIO),
        ]);

        $posicao = 0;
        foreach (self::RELATORIO as $nome => [$vendas, $custos, $despesas]) {
            $barraquinha = Barraquinha::create([
                'feira_id' => $feira->id,
                'posicao' => ++$posicao,
                'nome' => $nome,
                'status' => BarraquinhaStatus::Ativa,
            ]);

            $canais = $nome === 'Petisquim'
                ? [...self::CANAIS_PETISQUIM, 'pos_evento' => round($vendas - array_sum(self::CANAIS_PETISQUIM), 2)]
                : ['feira' => $vendas];

            $numero = 0;
            foreach ($canais as $canal => $total) {
                $venda = Venda::create([
                    'barraquinha_id' => $barraquinha->id,
                    'feira_id' => $feira->id,
                    'numero' => ++$numero,
                    'data_hora' => '2026-10-17 18:00:00',
                    'canal' => Canal::from($canal),
                    'pagamento' => FormaPagamento::Dinheiro,
                    'subtotal' => $total,
                    'desconto' => 0,
                    'total' => $total,
                    'status' => VendaStatus::Concluida,
                ]);
                VendaLinha::create([
                    'barraquinha_id' => $barraquinha->id,
                    'venda_id' => $venda->id,
                    'descricao' => 'Total informado no relatório consolidado 2026',
                    'tag' => VendaLinha::TAG_COMUM,
                    'quantidade' => 1,
                    'preco_unitario' => $total,
                    'desconto' => 0,
                    'total' => $total,
                ]);
            }

            foreach ([[LancamentoCategoria::Mercadoria, $custos, 'Custos informados no relatório 2026'], [LancamentoCategoria::OutraDespesa, $despesas, 'Despesas informadas no relatório 2026']] as [$categoria, $valor, $descricao]) {
                Lancamento::create([
                    'barraquinha_id' => $barraquinha->id,
                    'tipo' => $categoria->tipo(),
                    'categoria' => $categoria,
                    'descricao' => $descricao,
                    'valor' => $valor,
                    'data' => '2026-10-17',
                ]);
            }
        }
    }
}
