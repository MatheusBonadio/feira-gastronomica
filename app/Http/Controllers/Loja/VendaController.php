<?php

namespace App\Http\Controllers\Loja;

use App\Enums\Canal;
use App\Enums\FormaPagamento;
use App\Enums\VendaStatus;
use App\Http\Apresentacao;
use App\Http\Controllers\Controller;
use App\Models\Combo;
use App\Models\Item;
use App\Models\Venda;
use App\Models\VendaItem;
use App\Services\Financeiro\Filtro;
use App\Services\Vendas\VendaService;
use App\Support\Loja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VendaController extends Controller
{
    public function __construct(private readonly VendaService $vendas, private readonly Loja $loja) {}

    public function index(Request $request): Response
    {
        $barraquinha = $this->loja->barraquinha();
        $filtro = Filtro::daRequisicao($request);
        $status = VendaStatus::tryFrom((string) $request->query('status'));

        $vendas = $filtro->aplicarEmVendas(Venda::withoutGlobalScopes()->where('barraquinha_id', $barraquinha->id))
            ->when($status, fn ($q) => $q->where('status', $status->value))
            ->with(['linhas' => fn ($q) => $q->withoutGlobalScopes(), 'operador'])
            ->latest('data_hora')
            ->latest('id')
            ->paginate(config('feira.por_pagina'))
            ->withQueryString();

        return Inertia::render('loja/vendas/Index', [
            'vendas' => Apresentacao::paginacao($vendas, fn (Venda $v) => Apresentacao::venda($v)),
            'filtro' => [...$filtro->paraQuery(), 'status' => $status?->value],
            'canais' => Apresentacao::opcoes(Canal::cases()),
            'pagamentos' => Apresentacao::opcoes(FormaPagamento::cases()),
            'statusOpcoes' => Apresentacao::opcoes(VendaStatus::cases()),
            'numerosCombo' => Combo::withoutGlobalScopes()->where('barraquinha_id', $barraquinha->id)->orderBy('numero')->pluck('numero'),
        ]);
    }

    public function create(): Response
    {
        $feira = $this->loja->barraquinha()->feira;
        $checkout = $this->loja->barraquinha()->preferenciasCheckout();
        $canalInicial = session('canal', $checkout->canalPadrao ?? Canal::PADRAO->value);
        if ($canalInicial === Canal::PreVenda->value && ! $feira->preVendaAberta()) {
            $canalInicial = Canal::PADRAO->value;
        }
        $vendidos = VendaItem::whereHas('venda', fn ($q) => $q->concluidas())
            ->selectRaw('item_id, SUM(quantidade) as qtd')->groupBy('item_id')->toBase()->pluck('qtd', 'item_id');

        $itens = Item::with(['precos', 'categoria'])->ativos()->orderBy('nome')->get();
        if ($checkout->ordem === 'mais_vendidos') {
            $itens = $itens->sortByDesc(fn (Item $i) => (int) ($vendidos[$i->id] ?? 0))->values();
        }

        return Inertia::render('loja/vendas/Pdv', [
            'itens' => $itens->map(fn (Item $i) => Apresentacao::item($i, (int) ($vendidos[$i->id] ?? 0))),
            'combos' => Combo::with('itens.precos')->ativos()->orderBy('numero')->get()
                ->filter->aplicavel()
                ->map(fn (Combo $c) => Apresentacao::combo($c, porCanal: true))
                ->values(),
            'canais' => Apresentacao::opcoes(Canal::cases()),
            'pagamentos' => Apresentacao::opcoes(array_map(FormaPagamento::from(...), $checkout->pagamentos)),
            'canalInicial' => $canalInicial,
            'preVenda' => [
                'aberta' => $feira->preVendaAberta(),
                'corte' => $feira->data_corte_pre_venda?->toIso8601String(),
            ],
            'checkout' => $checkout->paraTela(),
        ]);
    }

    public function simular(Request $request): JsonResponse
    {
        $dados = $this->validarCarrinho($request, exigirPagamento: false);

        $resultado = $this->vendas->simular($this->loja->barraquinha(), Canal::from($dados['canal']), $dados['itens'] ?? []);

        return response()->json($resultado->paraArray());
    }

    public function store(Request $request): RedirectResponse
    {
        $dados = $this->validarCarrinho($request, exigirPagamento: true);

        $venda = $this->vendas->registrar(
            $this->loja->barraquinha(),
            $request->user(),
            Canal::from($dados['canal']),
            FormaPagamento::from($dados['pagamento']),
            $dados['itens'],
        );

        return redirect($this->loja->rota('vendas.create'))
            ->with('success', __('Venda #:n registrada: :resumo · :total', [
                'n' => $venda->numero,
                'resumo' => $venda->resumo(),
                'total' => moeda($venda->total),
            ]))
            ->with('canal', $dados['canal']);
    }

    public function show(Venda $venda): Response
    {
        $venda->load(['linhas' => fn ($q) => $q->withoutGlobalScopes(), 'operador', 'canceladaPor']);

        return Inertia::render('loja/vendas/Show', ['venda' => Apresentacao::venda($venda, detalhe: true)]);
    }

    public function cancelar(Request $request, Venda $venda): RedirectResponse
    {
        $dados = $request->validate(['motivo' => ['required', 'string', 'min:3', 'max:500']], attributes: ['motivo' => __('motivo')]);

        $this->vendas->cancelar($venda, $request->user(), $dados['motivo']);

        return redirect($this->loja->rota('vendas.show', $venda))->with('success', __('Venda cancelada.'));
    }

    private function validarCarrinho(Request $request, bool $exigirPagamento): array
    {
        $aceitas = $this->loja->barraquinha()->preferenciasCheckout()->pagamentos;

        return $request->validate([
            'canal' => ['required', Rule::enum(Canal::class)],
            'pagamento' => [$exigirPagamento ? 'required' : 'nullable', Rule::enum(FormaPagamento::class), Rule::in($aceitas)],
            'itens' => [$exigirPagamento ? 'required' : 'nullable', 'array'],
            'itens.*' => ['integer', 'min:0', 'max:999'],
        ], [
            'itens.required' => __('Adicione ao menos um item ao carrinho.'),
        ], [
            'canal' => __('canal'),
            'pagamento' => __('forma de pagamento'),
        ]);
    }
}
