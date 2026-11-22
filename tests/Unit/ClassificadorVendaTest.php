<?php

namespace Tests\Unit;

use App\Services\Vendas\ClassificadorVenda;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ClassificadorVendaTest extends TestCase
{
    private const PASTEL = 1;
    private const REFRI = 2;
    private const SOBREMESA = 3;

    private const ITENS = [
        self::PASTEL => ['nome' => 'Pastel', 'preco' => 25.00],
        self::REFRI => ['nome' => 'Refrigerante', 'preco' => 6.00],
        self::SOBREMESA => ['nome' => 'Sobremesa', 'preco' => 15.00],
    ];

    private function combo(int $numero, array $composicao, float $preco): array
    {
        return ['id' => $numero, 'numero' => $numero, 'nome' => "Combo {$numero}", 'composicao' => $composicao, 'preco' => $preco];
    }

    public static function exemplosDaEspecificacao(): array
    {
        return [
            '1 pastel' => [[self::PASTEL => 1], 'Comum', 2500],
            '1 pastel + 1 refrigerante' => [[self::PASTEL => 1, self::REFRI => 1], 'Combo 1', 2800],
            '2 pastéis + 1 refrigerante' => [[self::PASTEL => 2, self::REFRI => 1], 'Combo 1 + Comum', 5300],
            '2 pastéis + 2 refrigerantes' => [[self::PASTEL => 2, self::REFRI => 2], 'Combo 1 × 2', 5600],
            '2 refrigerantes' => [[self::REFRI => 2], 'Comum', 1200],
            '4 pastéis + 4 refrigerantes' => [[self::PASTEL => 4, self::REFRI => 4], 'Combo 1 × 4', 11200],
        ];
    }

    #[DataProvider('exemplosDaEspecificacao')]
    public function test_classifica_como_a_tabela_da_especificacao(array $carrinho, string $resumo, int $totalCentavos): void
    {
        $resultado = (new ClassificadorVenda)->classificar($carrinho, self::ITENS, [$this->combo(1, [self::PASTEL => 1, self::REFRI => 1], 28.00)]);

        $this->assertSame($resumo, $resultado->resumo());
        $this->assertSame($totalCentavos, $resultado->total());
    }

    public function test_item_em_dois_combos_escolhe_o_maior_desconto_para_o_cliente(): void
    {
        $combos = [
            $this->combo(1, [self::PASTEL => 1, self::REFRI => 1], 28.00),
            $this->combo(2, [self::PASTEL => 1, self::SOBREMESA => 1], 30.00),
        ];

        $resultado = (new ClassificadorVenda)->classificar([self::PASTEL => 1, self::REFRI => 1, self::SOBREMESA => 1], self::ITENS, $combos);

        $this->assertSame('Combo 2 + Comum', $resultado->resumo());
        $this->assertSame(1000, $resultado->desconto());
        $this->assertSame(3600, $resultado->total());
    }

    public function test_no_empate_de_desconto_prefere_o_combo_que_cobre_mais_itens(): void
    {
        $combos = [
            $this->combo(1, [self::PASTEL => 1, self::REFRI => 1], 28.00),
            $this->combo(2, [self::PASTEL => 1, self::SOBREMESA => 1, self::REFRI => 1], 43.00),
        ];

        $resultado = (new ClassificadorVenda)->classificar([self::PASTEL => 1, self::REFRI => 1, self::SOBREMESA => 1], self::ITENS, $combos);

        $this->assertSame('Combo 2', $resultado->resumo());
        $this->assertSame(4300, $resultado->total());
    }

    public function test_combo_mais_caro_que_a_soma_avulsa_nunca_e_aplicado(): void
    {
        $resultado = (new ClassificadorVenda)->classificar(
            [self::PASTEL => 1, self::REFRI => 1],
            self::ITENS,
            [$this->combo(1, [self::PASTEL => 1, self::REFRI => 1], 35.00)],
        );

        $this->assertSame('Comum', $resultado->resumo());
        $this->assertSame(3100, $resultado->total());
    }

    public function test_combo_com_quantidade_maior_que_um(): void
    {
        $resultado = (new ClassificadorVenda)->classificar(
            [self::PASTEL => 5, self::REFRI => 2],
            self::ITENS,
            [$this->combo(1, [self::PASTEL => 2, self::REFRI => 1], 50.00)],
        );

        $this->assertSame('Combo 1 × 2 + Comum', $resultado->resumo());
        $this->assertSame(2 * 5000 + 2500, $resultado->total());
    }

    public function test_carrinho_grande_com_muitos_combos_sobrepostos_tem_custo_limitado(): void
    {
        $itens = [];
        for ($i = 1; $i <= 8; $i++) {
            $itens[$i] = ['nome' => "Item {$i}", 'preco' => 10.00];
        }
        $combos = [];
        $numero = 1;
        for ($a = 1; $a <= 8; $a++) {
            for ($b = $a + 1; $b <= 8 && $numero <= 8; $b++, $numero++) {
                $combos[] = $this->combo($numero, [$a => 1, $b => 1], 18.00 - ($numero % 3));
            }
        }

        memory_reset_peak_usage();
        $memoriaInicial = memory_get_usage();
        $inicio = microtime(true);
        $resultado = (new ClassificadorVenda)->classificar(array_fill_keys(array_keys($itens), 999), $itens, $combos);
        $segundos = microtime(true) - $inicio;
        $megabytes = (memory_get_peak_usage() - $memoriaInicial) / 1048576;

        $this->assertLessThan(2.0, $segundos);
        $this->assertLessThan(32, $megabytes);
        $this->assertGreaterThan(0, $resultado->desconto());
        $this->assertSame(8 * 999 * 1000, $resultado->subtotal());
    }

    public function test_acha_o_otimo_mesmo_quando_o_combo_mais_eficiente_nao_deve_ser_usado_ao_maximo(): void
    {
        $combos = [
            $this->combo(1, [self::PASTEL => 1, self::REFRI => 1], 30.00),
            $this->combo(2, [self::PASTEL => 1, self::SOBREMESA => 1], 34.00),
            $this->combo(3, [self::REFRI => 1, self::SOBREMESA => 1], 15.00),
        ];

        $resultado = (new ClassificadorVenda)->classificar([self::PASTEL => 6, self::REFRI => 6, self::SOBREMESA => 6], self::ITENS, $combos);

        $this->assertSame('Combo 1 × 3 + Combo 2 × 3 + Combo 3 × 3', $resultado->resumo());
        $this->assertSame(3 * 100 + 3 * 600 + 3 * 600, $resultado->desconto());
    }

    public function test_carrinho_vazio_nao_gera_linhas(): void
    {
        $this->assertTrue((new ClassificadorVenda)->classificar([], self::ITENS, [])->vazio());
    }
}
