<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoriaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/Categorias', [
            'categorias' => Categoria::withCount('itens')->orderBy('nome')->get()->map(fn (Categoria $c) => [
                'id' => $c->id,
                'nome' => $c->nomeExibicao(),
                'ativo' => $c->ativo,
                'padrao' => in_array($c->nome, Categoria::PADRAO, true),
                'itens' => $c->itens_count,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $dados = $request->validate(['nome' => ['required', 'string', 'max:60', 'unique:categorias,nome']], attributes: ['nome' => __('nome')]);
        Categoria::create($dados);

        return back()->with('success', __('Categoria criada.'));
    }

    public function alternar(Categoria $categoria): RedirectResponse
    {
        $categoria->update(['ativo' => ! $categoria->ativo]);

        return back();
    }
}
