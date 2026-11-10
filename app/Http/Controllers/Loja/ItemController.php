<?php

namespace App\Http\Controllers\Loja;

use App\Enums\Canal;
use App\Http\Apresentacao;
use App\Http\Controllers\Controller;
use App\Http\Requests\ItemRequest;
use App\Models\Categoria;
use App\Models\Item;
use App\Models\VendaItem;
use App\Services\ItemService;
use App\Support\Loja;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function __construct(private readonly ItemService $itens, private readonly Loja $loja) {}

    public function index(): Response
    {
        $barraquinha = $this->loja->barraquinha();

        $vendidos = VendaItem::withoutGlobalScopes()
            ->where('barraquinha_id', $barraquinha->id)
            ->whereHas('venda', fn ($q) => $q->withoutGlobalScopes()->concluidas())
            ->selectRaw('item_id, SUM(quantidade) as qtd')
            ->groupBy('item_id')
            ->toBase()
            ->pluck('qtd', 'item_id');

        $itens = Item::withoutGlobalScopes()
            ->where('barraquinha_id', $barraquinha->id)
            ->with(['precos', 'categoria'])
            ->orderByDesc('ativo')
            ->orderBy('nome')
            ->get()
            ->map(fn (Item $i) => Apresentacao::item($i, (int) ($vendidos[$i->id] ?? 0)));

        return Inertia::render('loja/itens/Index', [
            'itens' => $itens,
            'canais' => Apresentacao::opcoes(Canal::cases()),
        ]);
    }

    public function create(): Response
    {
        return $this->formulario(new Item(['ativo' => true]));
    }

    public function store(ItemRequest $request): RedirectResponse
    {
        $this->itens->criar($this->loja->barraquinha(), $request->validated());

        return redirect($this->loja->rota('itens.index'))->with('success', __('Item cadastrado.'));
    }

    public function edit(Item $item): Response
    {
        return $this->formulario($item->load('precos'));
    }

    public function update(ItemRequest $request, Item $item): RedirectResponse
    {
        $this->itens->atualizar($item, $request->validated());

        return redirect($this->loja->rota('itens.index'))->with('success', __('Item atualizado. Vendas já registradas mantêm o preço antigo.'));
    }

    public function destroy(Item $item): RedirectResponse
    {
        $this->itens->excluir($item);

        return redirect($this->loja->rota('itens.index'))->with('success', __('Item excluído.'));
    }

    private function formulario(Item $item): Response
    {
        return Inertia::render('loja/itens/Form', [
            'item' => $item->exists ? Apresentacao::item($item) : null,
            'categorias' => Categoria::where('ativo', true)->orWhere('id', $item->categoria_id)->orderBy('nome')->get()
                ->map(fn (Categoria $c) => ['id' => $c->id, 'nome' => $c->nomeExibicao()]),
            'canais' => Apresentacao::opcoes(Canal::cases()),
            'canalPadrao' => Canal::PADRAO->value,
        ]);
    }
}
