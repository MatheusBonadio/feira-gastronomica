<?php

namespace App\Http\Controllers\Auth;

use App\Enums\AcaoAuditoria;
use App\Http\Controllers\Controller;
use App\Models\AuditoriaLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SenhaController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('auth/Senha', ['obrigatoria' => $request->user()->trocar_senha]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'senha_atual' => ['required', 'current_password'],
            'senha' => ['required', 'confirmed', 'different:senha_atual', Password::defaults()],
        ], attributes: [
            'senha_atual' => __('senha atual'),
            'senha' => __('nova senha'),
        ]);

        $user = $request->user();
        $user->update(['password' => $request->input('senha'), 'trocar_senha' => false]);

        AuditoriaLog::registrar(AcaoAuditoria::SenhaAlterada, $user);

        return redirect()->route($user->perfil->homeRoute())->with('success', __('Senha alterada.'));
    }
}
