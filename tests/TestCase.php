<?php

namespace Tests;

use App\Enums\BarraquinhaStatus;
use App\Enums\Canal;
use App\Enums\FeiraStatus;
use App\Enums\Perfil;
use App\Enums\TipoDesconto;
use App\Models\Barraquinha;
use App\Models\Categoria;
use App\Models\Combo;
use App\Models\ComboCanal;
use App\Models\ComboItem;
use App\Models\Feira;
use App\Models\Item;
use App\Models\ItemPreco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    public $mockConsoleOutput = false;

    protected function criarAdmin(): User
    {
        return User::create([
            'nome' => 'Professor',
            'usuario' => 'admin'.uniqid(),
            'password' => 'senha1234',
            'perfil' => Perfil::Admin,
        ]);
    }

    protected function criarFeira(array $attrs = []): Feira
    {
        return Feira::create([
            'nome' => 'Feira Teste',
            'data_inicio' => '2027-10-15',
            'data_fim' => '2027-10-16',
            'status' => FeiraStatus::Aberta,
            'qtd_barraquinhas' => 0,
            ...$attrs,
        ]);
    }

    protected function criarBarraquinha(?Feira $feira = null, string $nome = 'Senhor dos Pastéis'): Barraquinha
    {
        $feira ??= $this->criarFeira();
        $barraquinha = Barraquinha::create([
            'feira_id' => $feira->id,
            'posicao' => $feira->barraquinhas()->count() + 1,
            'nome' => $nome,
            'status' => BarraquinhaStatus::Ativa,
        ]);
        $feira->increment('qtd_barraquinhas');

        return $barraquinha;
    }

    protected function usuarioDa(Barraquinha $barraquinha, array $attrs = []): User
    {
        return User::create([
            'nome' => $barraquinha->nome,
            'usuario' => 'b'.$barraquinha->id.uniqid(),
            'password' => 'senha1234',
            'perfil' => Perfil::Barraquinha,
            'barraquinha_id' => $barraquinha->id,
            ...$attrs,
        ]);
    }

    protected function criarItem(Barraquinha $barraquinha, string $nome, float $precoFeira, ?float $precoPreVenda = null, array $attrs = []): Item
    {
        $categoria = Categoria::firstOrCreate(['nome' => 'Comida']);
        $item = Item::create([
            'barraquinha_id' => $barraquinha->id,
            'categoria_id' => $categoria->id,
            'nome' => $nome,
            'ativo' => true,
            ...$attrs,
        ]);
        ItemPreco::create(['barraquinha_id' => $barraquinha->id, 'item_id' => $item->id, 'canal' => Canal::Feira, 'preco' => $precoFeira]);
        if ($precoPreVenda !== null) {
            ItemPreco::create(['barraquinha_id' => $barraquinha->id, 'item_id' => $item->id, 'canal' => Canal::PreVenda, 'preco' => $precoPreVenda]);
        }

        return $item;
    }

    /** Sem $canais, a mesma regra vale nos três canais. */
    protected function criarCombo(Barraquinha $barraquinha, string $nome, array $composicao, float $valor, TipoDesconto $tipo = TipoDesconto::PrecoFechado, ?array $canais = null): Combo
    {
        $combo = Combo::create([
            'barraquinha_id' => $barraquinha->id,
            'nome' => $nome,
            'numero' => (int) Combo::withoutGlobalScopes()->where('barraquinha_id', $barraquinha->id)->max('numero') + 1,
            'ativo' => true,
        ]);
        foreach ($canais ?? Canal::cases() as $canal) {
            ComboCanal::create(['barraquinha_id' => $barraquinha->id, 'combo_id' => $combo->id, 'canal' => $canal, 'tipo_desconto' => $tipo, 'valor' => $valor]);
        }
        foreach ($composicao as [$item, $quantidade]) {
            ComboItem::create(['barraquinha_id' => $barraquinha->id, 'combo_id' => $combo->id, 'item_id' => $item->id, 'quantidade' => $quantidade]);
        }

        return $combo;
    }

    protected function cenarioPastelaria(?Feira $feira = null): array
    {
        $barraquinha = $this->criarBarraquinha($feira);
        $pastel = $this->criarItem($barraquinha, 'Pastel de carne', 25.00, 18.00, ['custo' => 7.50]);
        $refri = $this->criarItem($barraquinha, 'Refrigerante', 6.00, null, ['custo' => 3.00]);
        $combo = $this->criarCombo($barraquinha, 'Combo do Guerreiro', [[$pastel, 1], [$refri, 1]], 28.00);

        return [$barraquinha, $pastel, $refri, $combo];
    }
}
