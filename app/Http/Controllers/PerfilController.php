<?php

namespace App\Http\Controllers;

use App\Services\FotoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Configurações do próprio perfil (admin e barraquinha): nome e foto. A senha tem tela própria. */
class PerfilController extends Controller
{
    public function __construct(private readonly FotoService $fotos) {}

    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('perfil/Index', [
            'perfil' => [
                'nome' => $user->nome,
                'usuario' => $user->usuario,
                'perfilLabel' => $user->perfil->label(),
                'foto' => $user->fotoUrl(),
                'ultimoAcesso' => $user->ultimo_acesso_em?->toIso8601String(),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $dados = $request->validate(['nome' => ['required', 'string', 'max:120']], attributes: ['nome' => __('nome')]);

        $request->user()->update(['nome' => trim($dados['nome'])]);

        return back()->with('success', __('Perfil atualizado.'));
    }

    public function foto(Request $request): RedirectResponse
    {
        $request->validate(['foto' => FotoService::REGRAS], attributes: ['foto' => __('foto')]);

        $user = $request->user();
        $user->forceFill(['foto_path' => $this->fotos->substituir($user->foto_path, $request->file('foto'), 'usuarios')])->save();

        return back()->with('success', __('Foto atualizada.'));
    }

    public function removerFoto(Request $request): RedirectResponse
    {
        $user = $request->user();
        $this->fotos->remover($user->foto_path);
        $user->forceFill(['foto_path' => null])->save();

        return back()->with('success', __('Foto removida.'));
    }
}
