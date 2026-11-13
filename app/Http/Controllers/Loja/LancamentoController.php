<?php

namespace App\Http\Controllers\Loja;

use App\Enums\LancamentoCategoria;
use App\Enums\LancamentoTipo;
use App\Http\Apresentacao;
use App\Http\Controllers\Controller;
use App\Http\Requests\LancamentoRequest;
use App\Models\Lancamento;
use App\Models\Scopes\BarraquinhaScope;
use App\Services\Financeiro\Filtro;
use App\Services\LancamentoService;
use App\Support\Loja;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LancamentoController extends Controller
{
    public function __construct(private readonly LancamentoService $lancamentos, private readonly Loja $loja) {}

    public function index(Request $request): Response
    {
        $tipo = LancamentoTipo::tryFrom((string) $request->query('tipo'));
        $filtro = Filtro::daRequisicao($request);

        $lancamentos = $filtro
            ->aplicarEmLancamentos(Lancamento::withoutGlobalScope(BarraquinhaScope::class)->where('barraquinha_id', $this->loja->barraquinha()->id))
            ->when($tipo, fn ($q) => $q->where('tipo', $tipo->value))
            ->with('autor')
            ->latest('data')
            ->latest('id')
            ->paginate(config('feira.por_pagina'))
            ->withQueryString();

        return Inertia::render('loja/lancamentos/Index', [
            'lancamentos' => Apresentacao::paginacao($lancamentos, fn (Lancamento $l) => Apresentacao::lancamento($l)),
            'filtro' => ['tipo' => $tipo?->value, 'de' => $filtro->de?->toDateString(), 'ate' => $filtro->ate?->toDateString()],
            'tipos' => Apresentacao::opcoes(LancamentoTipo::cases()),
        ]);
    }

    public function create(Request $request): Response
    {
        $tipo = LancamentoTipo::tryFrom((string) $request->query('tipo')) ?? LancamentoTipo::Saida;

        return $this->formulario(null, $tipo);
    }

    public function store(LancamentoRequest $request): RedirectResponse
    {
        $this->lancamentos->criar($this->loja->barraquinha(), $request->user(), $request->validated(), $request->file('comprovante'));

        return redirect($this->loja->rota('lancamentos.index'))->with('success', __('Lançamento registrado.'));
    }

    public function edit(Lancamento $lancamento): Response
    {
        return $this->formulario($lancamento, $lancamento->tipo);
    }

    public function update(LancamentoRequest $request, Lancamento $lancamento): RedirectResponse
    {
        $this->lancamentos->atualizar($lancamento, $request->validated(), $request->file('comprovante'));

        return redirect($this->loja->rota('lancamentos.index'))->with('success', __('Lançamento atualizado.'));
    }

    public function destroy(Lancamento $lancamento): RedirectResponse
    {
        $this->lancamentos->excluir($lancamento);

        return redirect($this->loja->rota('lancamentos.index'))->with('success', __('Lançamento excluído (continua no histórico).'));
    }

    public function comprovante(Lancamento $lancamento): BinaryFileResponse
    {
        $caminho = $this->lancamentos->caminhoComprovante($lancamento);
        abort_unless($caminho, 404);

        return response()->file($caminho);
    }

    private function formulario(?Lancamento $lancamento, LancamentoTipo $tipo): Response
    {
        $categorias = [];
        foreach (LancamentoCategoria::porTipo() as $valorTipo => $lista) {
            $categorias[$valorTipo] = array_map(fn (LancamentoCategoria $c) => [
                ...Apresentacao::enum($c),
                'grupo' => LancamentoCategoria::grupoLabel($c->grupo()),
            ], $lista);
        }

        return Inertia::render('loja/lancamentos/Form', [
            'lancamento' => $lancamento ? Apresentacao::lancamento($lancamento) : null,
            'tipoInicial' => $tipo->value,
            'tipos' => Apresentacao::opcoes(LancamentoTipo::cases()),
            'categorias' => $categorias,
            'hoje' => today()->toDateString(),
        ]);
    }
}
