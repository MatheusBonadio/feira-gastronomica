<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AcaoAuditoria;
use App\Http\Controllers\Controller;
use App\Models\AuditoriaLog;
use App\Models\Barraquinha;
use App\Models\User;
use App\Services\CredencialService;
use App\Support\FeiraAtual;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use App\Http\Apresentacao;
use Inertia\Inertia;
use Inertia\Response;

class BarraquinhaController extends Controller
{
    public function __construct(private readonly CredencialService $credenciais) {}

    public function index(): Response
    {
        $feira = FeiraAtual::obter();

        $barraquinhas = $feira?->barraquinhas()->with('usuario')->withCount(['vendas', 'itens', 'combos'])->get() ?? collect();

        return Inertia::render('admin/barraquinhas/Index', [
            'feira' => $feira ? ['id' => $feira->id, 'nome' => $feira->nome, 'qtd' => $feira->qtd_barraquinhas, 'encerrada' => $feira->estaEncerrada()] : null,
            'barraquinhas' => $barraquinhas->map(fn (Barraquinha $b) => [
                ...Apresentacao::barraquinha($b),
                'usuario' => $b->usuario?->usuario,
                'ultimoAcesso' => $b->usuario?->ultimo_acesso_em?->toIso8601String(),
                'vendas' => $b->vendas_count,
                'itens' => $b->itens_count,
                'combos' => $b->combos_count,
            ])->values(),
        ]);
    }

    public function edit(Barraquinha $barraquinha): Response
    {
        $barraquinha->load('usuario', 'feira');

        return Inertia::render('admin/barraquinhas/Form', [
            'barraquinha' => [
                ...Apresentacao::barraquinha($barraquinha),
                'nomeCadastrado' => $barraquinha->nome,
                'feira' => $barraquinha->feira->nome,
                'usuario' => $barraquinha->usuario ? [
                    'usuario' => $barraquinha->usuario->usuario,
                    'trocarSenha' => $barraquinha->usuario->trocar_senha,
                    'ultimoAcesso' => $barraquinha->usuario->ultimo_acesso_em?->toIso8601String(),
                ] : null,
            ],
            'sugestao' => $this->credenciais->sugerirUsuario($barraquinha),
        ]);
    }

    public function update(Request $request, Barraquinha $barraquinha): RedirectResponse
    {
        $dados = $request->validate([
            'nome' => ['required', 'string', 'max:120', Rule::unique('barraquinhas')->where('feira_id', $barraquinha->feira_id)->ignore($barraquinha)],
            'responsaveis' => ['nullable', 'string', 'max:2000'],
            'meta_vendas' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
        ], attributes: ['nome' => __('nome'), 'responsaveis' => __('responsáveis'), 'meta_vendas' => __('meta de vendas')]);

        $antes = $barraquinha->only(array_keys($dados));
        $barraquinha->update($dados);
        $barraquinha->usuario?->update(['nome' => $barraquinha->nomeExibicao()]);

        AuditoriaLog::registrar(AcaoAuditoria::BarraquinhaAlterada, $barraquinha, detalhe: ['antes' => $antes, 'depois' => $dados], barraquinhaId: $barraquinha->id);

        return redirect()->route('admin.barraquinhas.edit', $barraquinha)->with('success', __('Barraquinha salva.'));
    }

    public function gerarCredenciais(Barraquinha $barraquinha): RedirectResponse
    {
        $this->exigirNome($barraquinha);

        return $this->mostrarUmaVez($barraquinha, $this->credenciais->gerar($barraquinha));
    }

    public function definirCredenciais(Request $request, Barraquinha $barraquinha): RedirectResponse
    {
        $this->exigirNome($barraquinha);

        $dados = $request->validate([
            'usuario' => ['required', 'string', 'min:3', 'max:60', 'regex:/^[a-z0-9._-]+$/i',
                Rule::unique(User::class, 'usuario')->ignore($barraquinha->usuario?->id)],
            'senha' => ['required', 'string', Password::defaults()],
        ], attributes: ['usuario' => __('usuário'), 'senha' => __('senha')]);

        return $this->mostrarUmaVez($barraquinha, $this->credenciais->definir($barraquinha, $dados['usuario'], $dados['senha']));
    }

    public function redefinirSenha(Barraquinha $barraquinha): RedirectResponse
    {
        return $this->mostrarUmaVez($barraquinha, $this->credenciais->redefinirSenha($barraquinha));
    }

    public function bloquear(Barraquinha $barraquinha): RedirectResponse
    {
        $this->credenciais->bloquear($barraquinha);

        return back()->with('success', __('Acesso bloqueado. Os dados da barraquinha foram mantidos.'));
    }

    public function reativar(Barraquinha $barraquinha): RedirectResponse
    {
        $this->credenciais->reativar($barraquinha);

        return back()->with('success', __('Acesso reativado.'));
    }

    private function mostrarUmaVez(Barraquinha $barraquinha, array $credenciais): RedirectResponse
    {
        Inertia::flash('credenciais', $credenciais);

        return redirect()->route('admin.barraquinhas.edit', $barraquinha)
            ->with('success', __('Credenciais prontas. Copie e repasse à equipe: a senha não será exibida de novo.'));
    }

    private function exigirNome(Barraquinha $barraquinha): void
    {
        abort_if($barraquinha->ehVaga(), 422, __('Dê um nome à barraquinha antes de criar o acesso.'));
    }
}
