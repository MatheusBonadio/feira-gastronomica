<?php

namespace Database\Seeders;

use App\Enums\BarraquinhaStatus;
use App\Enums\Canal;
use App\Enums\FeiraStatus;
use App\Enums\FormaPagamento;
use App\Enums\LancamentoCategoria;
use App\Enums\Perfil;
use App\Enums\TipoDesconto;
use App\Models\Barraquinha;
use App\Models\Categoria;
use App\Models\Combo;
use App\Models\ComboItem;
use App\Models\Feira;
use App\Models\Item;
use App\Models\ItemPreco;
use App\Models\Lancamento;
use App\Models\User;
use App\Services\CredencialService;
use App\Services\Vendas\VendaService;
use Illuminate\Database\Seeder;

/**
 * Edição aberta para demonstração: 12 vagas (11 barraquinhas de 2026 + 1 em
 * branco). Itens e combos de Senhor dos Pastéis, CrepeUna, Pizzarito e Mundo
 * Fritas seguem os exemplos do relatório 2026; os demais itens são ilustrativos.
 */
class Feira2027Seeder extends Seeder
{
    /** nome => [itens: [nome, categoria, preço feira, preço pré-venda, custo], combos: [nome, [[item, qtd]], tipo, valor]] */
    private const CARDAPIO = [
        'Senhor dos Pastéis' => [
            'itens' => [
                ['Pastel de carne', 'Comida', 25.00, 18.00, 7.50],
                ['Pastel de frango com Catupiry', 'Comida', 25.00, 18.00, 7.00],
                ['Pastel de chocolate', 'Sobremesa', 15.00, null, 4.00],
                ['Refrigerante lata', 'Bebida', 6.00, null, 3.00],
            ],
            'combos' => [
                ['Combo do Guerreiro', [['Pastel de carne', 1], ['Refrigerante lata', 1]], 'preco_fechado', 28.00],
                ['O Hobbit e o Dragão', [['Pastel de carne', 1], ['Pastel de chocolate', 1], ['Refrigerante lata', 1]], 'preco_fechado', 43.00],
            ],
        ],
        'CrepeUna' => [
            'itens' => [
                ['Crepe de frango', 'Comida', 20.00, 17.00, 6.00],
                ['Crepe de Nutella', 'Sobremesa', 18.00, 15.00, 5.50],
                ['Suco natural', 'Bebida', 8.00, null, 2.50],
            ],
            'combos' => [['Eu Mereço', [['Crepe de frango', 2], ['Suco natural', 1]], 'preco_fechado', 38.00]],
        ],
        'Pizzarito' => [
            'itens' => [
                ['Minipizza', 'Comida', 8.00, 7.00, 2.50],
                ['Refrigerante 2 L', 'Bebida', 14.00, null, 8.00],
            ],
            // Preço "a confirmar" no relatório: aqui como 10% de desconto.
            'combos' => [['Combo família', [['Minipizza', 5], ['Refrigerante 2 L', 1]], 'percentual', 10.00]],
        ],
        'Mundo Fritas' => [
            'itens' => [
                ['Batata frita', 'Comida', 22.00, 20.00, 6.00],
                ['Molho especial', 'Comida', 4.00, null, 1.00],
                ['Refrigerante lata', 'Bebida', 6.00, null, 3.00],
            ],
            'combos' => [['Combo com molho', [['Batata frita', 1], ['Molho especial', 1], ['Refrigerante lata', 1]], 'preco_fechado', 29.90]],
        ],
        'Petisquim' => ['itens' => [['Porção de petiscos', 'Comida', 35.00, 30.00, 14.00], ['Refrigerante lata', 'Bebida', 6.00, null, 3.00]], 'combos' => []],
        'Bigas' => ['itens' => [['Hambúrguer artesanal', 'Comida', 30.00, 26.00, 12.00], ['Refrigerante lata', 'Bebida', 6.00, null, 3.00]], 'combos' => []],
        'Frango Supremo' => ['itens' => [['Porção de frango', 'Comida', 30.00, 26.00, 13.00]], 'combos' => []],
        'Copitos' => ['itens' => [['Copo da felicidade', 'Sobremesa', 20.00, 18.00, 8.00]], 'combos' => []],
        'Chama no Espeto' => ['itens' => [['Espetinho de carne', 'Comida', 12.00, null, 5.00], ['Espetinho de frango', 'Comida', 10.00, null, 4.00]], 'combos' => []],
        'Churros do Madruga' => ['itens' => [['Churros de doce de leite', 'Sobremesa', 12.00, 10.00, 3.00]], 'combos' => []],
        'Entre Chocolates' => ['itens' => [['Brigadeiro gourmet', 'Sobremesa', 5.00, 4.00, 1.50], ['Bolo de pote', 'Sobremesa', 14.00, 12.00, 5.00]], 'combos' => []],
    ];

    /** Carrinhos de demonstração: [barraquinha, canal, pagamento, [item => qtd]] */
    private const VENDAS = [
        ['Senhor dos Pastéis', 'feira', 'pix', ['Pastel de carne' => 1, 'Refrigerante lata' => 1]],
        ['Senhor dos Pastéis', 'feira', 'cartao', ['Pastel de carne' => 2, 'Refrigerante lata' => 2]],
        ['Senhor dos Pastéis', 'feira', 'dinheiro', ['Pastel de carne' => 2, 'Refrigerante lata' => 1]],
        ['Senhor dos Pastéis', 'pre_venda', 'pix', ['Pastel de frango com Catupiry' => 3]],
        ['Senhor dos Pastéis', 'feira', 'pix', ['Pastel de carne' => 1, 'Pastel de chocolate' => 1, 'Refrigerante lata' => 1]],
        ['Senhor dos Pastéis', 'feira', 'dinheiro', ['Refrigerante lata' => 2]],
        ['CrepeUna', 'pre_venda', 'pix', ['Crepe de frango' => 2, 'Suco natural' => 1]],
        ['CrepeUna', 'feira', 'cartao', ['Crepe de Nutella' => 2, 'Suco natural' => 2]],
        ['Pizzarito', 'feira', 'pix', ['Minipizza' => 5, 'Refrigerante 2 L' => 1]],
        ['Pizzarito', 'feira', 'dinheiro', ['Minipizza' => 3]],
        ['Mundo Fritas', 'pre_venda', 'pix', ['Batata frita' => 1, 'Molho especial' => 1, 'Refrigerante lata' => 1]],
        ['Mundo Fritas', 'feira', 'cartao', ['Batata frita' => 2, 'Molho especial' => 1]],
        ['Frango Supremo', 'feira', 'pix', ['Porção de frango' => 2]],
        ['Entre Chocolates', 'feira', 'dinheiro', ['Brigadeiro gourmet' => 6, 'Bolo de pote' => 1]],
    ];

    public function run(): void
    {
        $feira = Feira::create([
            'nome' => 'Feira Gastronômica 2027',
            'data_inicio' => '2027-10-15',
            'data_fim' => '2027-10-16',
            'status' => FeiraStatus::Aberta,
            'qtd_barraquinhas' => 12,
        ]);

        $categorias = Categoria::pluck('id', 'nome');
        $credenciais = app(CredencialService::class);
        $barraquinhas = [];
        $posicao = 0;

        foreach (self::CARDAPIO as $nome => $cardapio) {
            $barraquinha = Barraquinha::create([
                'feira_id' => $feira->id,
                'posicao' => ++$posicao,
                'nome' => $nome,
                'status' => BarraquinhaStatus::Ativa,
                'meta_vendas' => $nome === 'Senhor dos Pastéis' ? 15000 : null,
            ]);
            $barraquinhas[$nome] = $barraquinha;

            User::create([
                'nome' => $nome,
                'usuario' => $credenciais->sugerirUsuario($barraquinha),
                'password' => DatabaseSeeder::senhaDemo(),
                'perfil' => Perfil::Barraquinha,
                'barraquinha_id' => $barraquinha->id,
                'trocar_senha' => false,
            ]);

            $itens = [];
            foreach ($cardapio['itens'] as [$item, $categoria, $precoFeira, $precoPre, $custo]) {
                $modelo = Item::create([
                    'barraquinha_id' => $barraquinha->id,
                    'categoria_id' => $categorias[$categoria],
                    'nome' => $item,
                    'custo' => $custo,
                    'estoque_inicial' => $item === 'Pastel de carne' ? 300 : null,
                    'ativo' => true,
                ]);
                ItemPreco::create(['barraquinha_id' => $barraquinha->id, 'item_id' => $modelo->id, 'canal' => Canal::Feira, 'preco' => $precoFeira]);
                if ($precoPre) {
                    ItemPreco::create(['barraquinha_id' => $barraquinha->id, 'item_id' => $modelo->id, 'canal' => Canal::PreVenda, 'preco' => $precoPre]);
                }
                $itens[$item] = $modelo;
            }

            foreach ($cardapio['combos'] as $n => [$combo, $composicao, $tipo, $valor]) {
                $modelo = Combo::create([
                    'barraquinha_id' => $barraquinha->id,
                    'nome' => $combo,
                    'numero' => $n + 1,
                    'tipo_desconto' => TipoDesconto::from($tipo),
                    'valor' => $valor,
                    'ativo' => true,
                ]);
                foreach ($composicao as [$item, $qtd]) {
                    ComboItem::create(['barraquinha_id' => $barraquinha->id, 'combo_id' => $modelo->id, 'item_id' => $itens[$item]->id, 'quantidade' => $qtd]);
                }
            }

            Lancamento::create([
                'barraquinha_id' => $barraquinha->id,
                'tipo' => LancamentoCategoria::Mercadoria->tipo(),
                'categoria' => LancamentoCategoria::Mercadoria,
                'descricao' => 'Compra inicial de insumos',
                'valor' => 80.00,
                'data' => today(),
            ]);
        }

        // Vaga 12: criada pela quantidade da feira e ainda não preenchida.
        Barraquinha::create(['feira_id' => $feira->id, 'posicao' => ++$posicao, 'status' => BarraquinhaStatus::Ativa]);

        Lancamento::create([
            'barraquinha_id' => $barraquinhas['Senhor dos Pastéis']->id,
            'tipo' => LancamentoCategoria::Patrocinio->tipo(),
            'categoria' => LancamentoCategoria::Patrocinio,
            'descricao' => 'Patrocínio de distribuidora de bebidas',
            'valor' => 200.00,
            'data' => today(),
        ]);

        $vendas = app(VendaService::class);
        foreach (self::VENDAS as [$nome, $canal, $pagamento, $carrinho]) {
            $barraquinha = $barraquinhas[$nome];
            $ids = Item::withoutGlobalScopes()->where('barraquinha_id', $barraquinha->id)->pluck('id', 'nome');
            $vendas->registrar(
                $barraquinha,
                $barraquinha->usuario,
                Canal::from($canal),
                FormaPagamento::from($pagamento),
                collect($carrinho)->mapWithKeys(fn ($qtd, $item) => [$ids[$item] => $qtd])->all(),
            );
        }
    }
}
