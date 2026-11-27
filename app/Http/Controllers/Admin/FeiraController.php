<?php

namespace App\Http\Controllers\Admin;

use App\Enums\FeiraStatus;
use App\Http\Controllers\Controller;
use App\Models\Feira;
use App\Services\FeiraService;
use App\Support\FeiraAtual;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use App\Http\Apresentacao;
use Inertia\Inertia;
use Inertia\Response;

class FeiraController extends Controller
{
    public function __construct(private readonly FeiraService $feiras) {}

    public function index(): Response
    {
        $atual = FeiraAtual::obter();

        return Inertia::render('admin/feiras/Index', [
            'feiras' => Feira::recentes()
                ->withCount(['vendas' => fn ($q) => $q->withoutGlobalScopes()->concluidas(), 'barraquinhas'])
                ->get()
                ->map(fn (Feira $f) => [
                    ...$this->dados($f),
                    'vendas' => $f->vendas_count,
                    'barraquinhasCadastradas' => $f->barraquinhas_count,
                    'atual' => $f->id === $atual?->id,
                ]),
        ]);
    }

    public function create(): Response
    {
        return $this->formulario(new Feira(['status' => FeiraStatus::Planejada, 'qtd_barraquinhas' => 11]));
    }

    public function store(Request $request): RedirectResponse
    {
        $feira = $this->feiras->criar($this->validar($request));
        FeiraAtual::definir($feira);

        return redirect()->route('admin.barraquinhas.index')->with('success', __('Feira criada com :n vagas. Preencha cada barraquinha.', ['n' => $feira->qtd_barraquinhas]));
    }

    public function edit(Feira $feira): Response
    {
        return $this->formulario($feira);
    }

    public function update(Request $request, Feira $feira): RedirectResponse
    {
        $this->feiras->atualizar($feira, $this->validar($request));

        return redirect()->route('admin.feiras.index')->with('success', __('Feira atualizada.'));
    }

    public function selecionar(Feira $feira): RedirectResponse
    {
        FeiraAtual::definir($feira);

        return redirect()->back(fallback: route('admin.painel'));
    }

    public function encerrar(Feira $feira): RedirectResponse
    {
        $this->feiras->encerrar($feira);

        return back()->with('success', __('Feira encerrada: lançamentos bloqueados e relatórios congelados.'));
    }

    public function reabrir(Feira $feira): RedirectResponse
    {
        $this->feiras->reabrir($feira);

        return back()->with('success', __('Feira reaberta.'));
    }

    public function duplicarForm(Feira $feira): Response
    {
        return Inertia::render('admin/feiras/Duplicar', ['origem' => $this->dados($feira)]);
    }

    public function duplicar(Request $request, Feira $feira): RedirectResponse
    {
        $dados = $request->validate([
            'nome' => ['required', 'string', 'max:120'],
            ...$this->regrasDeData($request),
        ], attributes: $this->atributos());

        $nova = $this->feiras->duplicar($feira, $dados);
        FeiraAtual::definir($nova);

        return redirect()->route('admin.barraquinhas.index')->with('success', __('Feira duplicada. Gere os acessos das barraquinhas.'));
    }

    private function formulario(Feira $feira): Response
    {
        return Inertia::render('admin/feiras/Form', [
            'feira' => $feira->exists ? $this->dados($feira) : [
                'id' => null, 'nome' => '', 'dataInicio' => '', 'dataFim' => '', 'dataCortePreVenda' => '',
                'status' => Apresentacao::enum($feira->status), 'qtdBarraquinhas' => $feira->qtd_barraquinhas,
            ],
            'statusOpcoes' => Apresentacao::opcoes(FeiraStatus::cases()),
        ]);
    }

    private function dados(Feira $f): array
    {
        return [
            'id' => $f->id,
            'nome' => $f->nome,
            'dataInicio' => $f->data_inicio->toDateString(),
            'dataFim' => $f->data_fim->toDateString(),
            'dataCortePreVenda' => $f->data_corte_pre_venda?->format('Y-m-d\\TH:i') ?? '',
            'status' => Apresentacao::enum($f->status),
            'qtdBarraquinhas' => $f->qtd_barraquinhas,
            'encerrada' => $f->estaEncerrada(),
        ];
    }

    private function validar(Request $request): array
    {
        return $request->validate([
            'nome' => ['required', 'string', 'max:120'],
            ...$this->regrasDeData($request),
            'status' => ['required', Rule::enum(FeiraStatus::class)],
            'qtd_barraquinhas' => ['required', 'integer', 'min:1', 'max:200'],
        ], attributes: $this->atributos());
    }

    private function regrasDeData(Request $request): array
    {
        return [
            'data_inicio' => ['required', 'date'],
            'data_fim' => ['required', 'date', 'after_or_equal:data_inicio'],
            // O corte pode cair no próprio primeiro dia (ex.: até a abertura), nunca depois dele.
            'data_corte_pre_venda' => ['bail', 'required', 'date', function (string $atributo, mixed $valor, Closure $falhar) use ($request) {
                $inicio = (string) $request->input('data_inicio');
                if (strtotime($inicio) !== false && Carbon::parse($valor)->toDateString() > Carbon::parse($inicio)->toDateString()) {
                    $falhar(__('O fim da pré-venda não pode passar do dia de início da feira.'));
                }
            }],
        ];
    }

    private function atributos(): array
    {
        return [
            'nome' => __('nome'),
            'data_inicio' => __('data de início'),
            'data_fim' => __('data de fim'),
            'data_corte_pre_venda' => __('fim da pré-venda'),
            'status' => __('status'),
            'qtd_barraquinhas' => __('quantidade de barraquinhas'),
        ];
    }
}
