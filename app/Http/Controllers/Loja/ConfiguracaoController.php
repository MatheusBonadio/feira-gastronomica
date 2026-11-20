<?php

namespace App\Http\Controllers\Loja;

use App\Enums\Canal;
use App\Enums\FormaPagamento;
use App\Http\Apresentacao;
use App\Http\Controllers\Controller;
use App\Services\FotoService;
use App\Support\Loja;
use App\Support\PreferenciasCheckout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConfiguracaoController extends Controller
{
    public function __construct(private readonly Loja $loja, private readonly FotoService $fotos) {}

    public function edit(): Response
    {
        $barraquinha = $this->loja->barraquinha();

        return Inertia::render('loja/Configuracoes', [
            'barraquinha' => Apresentacao::barraquinha($barraquinha),
            'checkout' => $barraquinha->preferenciasCheckout()->paraTela(),
            'canais' => Apresentacao::opcoes(Canal::cases()),
            'pagamentos' => Apresentacao::opcoes(FormaPagamento::cases()),
        ]);
    }

    public function checkout(Request $request): RedirectResponse
    {
        $dados = $request->validate(PreferenciasCheckout::regras(), attributes: PreferenciasCheckout::atributos());

        $this->loja->barraquinha()->forceFill(['checkout' => PreferenciasCheckout::de($dados)->paraJson()])->save();

        return back()->with('success', __('Checkout atualizado.'));
    }

    public function foto(Request $request): RedirectResponse
    {
        $request->validate(['foto' => FotoService::REGRAS], attributes: ['foto' => __('foto')]);

        $barraquinha = $this->loja->barraquinha();
        $barraquinha->forceFill(['foto_path' => $this->fotos->substituir($barraquinha->foto_path, $request->file('foto'), 'barraquinhas')])->save();

        return back()->with('success', __('Foto da barraquinha atualizada.'));
    }

    public function removerFoto(): RedirectResponse
    {
        $barraquinha = $this->loja->barraquinha();
        $this->fotos->remover($barraquinha->foto_path);
        $barraquinha->forceFill(['foto_path' => null])->save();

        return back()->with('success', __('Foto da barraquinha removida.'));
    }
}
