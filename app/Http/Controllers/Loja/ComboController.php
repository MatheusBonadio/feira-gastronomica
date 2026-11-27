<?php

namespace App\Http\Controllers\Loja;

use App\Enums\Canal;
use App\Enums\TipoDesconto;
use App\Http\Apresentacao;
use App\Http\Controllers\Controller;
use App\Http\Requests\ComboRequest;
use App\Models\Combo;
use App\Models\Item;
use App\Services\ComboService;
use App\Support\Loja;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ComboController extends Controller
{
    public function __construct(private readonly ComboService $combos, private readonly Loja $loja) {}

    public function index(): Response
    {
        $combos = Combo::withoutGlobalScopes()
            ->where('barraquinha_id', $this->loja->barraquinha()->id)
            ->with(['itens.precos', 'canais'])
            ->withCount(['linhasVendidas as vendas_count' => fn ($q) => $q->withoutGlobalScopes()])
            ->orderBy('numero')
            ->get()
            ->map(fn (Combo $c) => Apresentacao::combo($c));

        return Inertia::render('loja/combos/Index', ['combos' => $combos, 'canais' => Apresentacao::opcoes(Canal::cases())]);
    }

    public function create(): Response
    {
        return $this->formulario(new Combo);
    }

    public function store(ComboRequest $request): RedirectResponse
    {
        $combo = $this->combos->salvar($this->loja->barraquinha(), null, $request->validated());

        return redirect($this->loja->rota('combos.index'))->with('success', __(':tag criado.', ['tag' => $combo->tag()]));
    }

    public function edit(Combo $combo): Response
    {
        return $this->formulario($combo->load(['itens.precos', 'canais']));
    }

    public function update(ComboRequest $request, Combo $combo): RedirectResponse
    {
        $this->combos->salvar($this->loja->barraquinha(), $combo, $request->validated());

        return redirect($this->loja->rota('combos.index'))->with('success', __('Combo atualizado.'));
    }

    public function alternar(Combo $combo): RedirectResponse
    {
        $combo = $this->combos->alternarAtivo($combo);

        return back()->with('success', $combo->ativo ? __('Combo reativado.') : __('Combo desativado.'));
    }

    public function destroy(Combo $combo): RedirectResponse
    {
        $this->combos->excluir($combo);

        return redirect($this->loja->rota('combos.index'))->with('success', __('Combo excluído.'));
    }

    private function formulario(Combo $combo): Response
    {
        $selecionados = $combo->exists ? $combo->itens->pluck('id')->all() : [];

        $itens = Item::withoutGlobalScopes()
            ->where('barraquinha_id', $this->loja->barraquinha()->id)
            ->where(fn ($q) => $q->where('ativo', true)->orWhereIn('id', $selecionados))
            ->with(['precos', 'categoria'])
            ->orderBy('nome')
            ->get()
            ->map(fn (Item $i) => Apresentacao::item($i));

        return Inertia::render('loja/combos/Form', [
            'combo' => $combo->exists ? Apresentacao::combo($combo) : null,
            'itens' => $itens,
            'tiposDesconto' => Apresentacao::opcoes(TipoDesconto::cases()),
            'canais' => Apresentacao::opcoes(Canal::cases()),
        ]);
    }
}
