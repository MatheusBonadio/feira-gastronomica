<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\SenhaController;
use App\Http\Controllers\IdiomaController;
use App\Http\Controllers\Loja;
use App\Http\RotasDaLoja;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => auth()->check()
    ? redirect()->route(auth()->user()->perfil->homeRoute())
    : redirect()->route('login'));

Route::get('idioma/{idioma}', IdiomaController::class)->name('idioma');

// Tela de login única para os dois perfis.
Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'show'])->name('login');
    Route::post('login', [LoginController::class, 'store'])->middleware('throttle:30,1');
});

Route::middleware(['auth', 'auth.session', 'acesso.ativo'])->group(function () {
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');
    Route::get('senha', [SenhaController::class, 'edit'])->name('senha.edit');
    Route::put('senha', [SenhaController::class, 'update'])->name('senha.update');

    Route::middleware('senha.trocada')->group(function () {

        Route::prefix('admin')->name('admin.')->middleware('perfil:admin')->group(function () {
            Route::get('/', [Admin\PainelController::class, 'index'])->name('painel');
            Route::get('pulso', [Admin\PainelController::class, 'pulso'])->name('painel.pulso');
            Route::get('pendencias', [Admin\PainelController::class, 'pendencias'])->name('pendencias');
            Route::get('comparar-feiras', [Admin\PainelController::class, 'compararFeiras'])->name('comparar-feiras');

            Route::resource('feiras', Admin\FeiraController::class)->except(['show', 'destroy']);
            Route::post('feiras/{feira}/selecionar', [Admin\FeiraController::class, 'selecionar'])->name('feiras.selecionar');
            Route::patch('feiras/{feira}/encerrar', [Admin\FeiraController::class, 'encerrar'])->name('feiras.encerrar');
            Route::patch('feiras/{feira}/reabrir', [Admin\FeiraController::class, 'reabrir'])->name('feiras.reabrir');
            Route::get('feiras/{feira}/duplicar', [Admin\FeiraController::class, 'duplicarForm'])->name('feiras.duplicar');
            Route::post('feiras/{feira}/duplicar', [Admin\FeiraController::class, 'duplicar'])->name('feiras.duplicar.store');

            Route::get('barraquinhas', [Admin\BarraquinhaController::class, 'index'])->name('barraquinhas.index');
            Route::get('barraquinhas/{barraquinha}/editar', [Admin\BarraquinhaController::class, 'edit'])->name('barraquinhas.edit');
            Route::put('barraquinhas/{barraquinha}', [Admin\BarraquinhaController::class, 'update'])->name('barraquinhas.update');
            Route::post('barraquinhas/{barraquinha}/credenciais/gerar', [Admin\BarraquinhaController::class, 'gerarCredenciais'])->name('barraquinhas.credenciais.gerar');
            Route::put('barraquinhas/{barraquinha}/credenciais', [Admin\BarraquinhaController::class, 'definirCredenciais'])->name('barraquinhas.credenciais.definir');
            Route::post('barraquinhas/{barraquinha}/credenciais/redefinir', [Admin\BarraquinhaController::class, 'redefinirSenha'])->name('barraquinhas.credenciais.redefinir');
            Route::patch('barraquinhas/{barraquinha}/bloquear', [Admin\BarraquinhaController::class, 'bloquear'])->name('barraquinhas.bloquear');
            Route::patch('barraquinhas/{barraquinha}/reativar', [Admin\BarraquinhaController::class, 'reativar'])->name('barraquinhas.reativar');

            Route::get('categorias', [Admin\CategoriaController::class, 'index'])->name('categorias.index');
            Route::post('categorias', [Admin\CategoriaController::class, 'store'])->name('categorias.store');
            Route::patch('categorias/{categoria}', [Admin\CategoriaController::class, 'alternar'])->name('categorias.alternar');

            Route::get('auditoria', [Admin\AuditoriaController::class, 'index'])->name('auditoria.index');

            Route::get('relatorios', [Loja\RelatorioController::class, 'index'])->name('relatorios.index');
            Route::get('relatorios/exportar', [Loja\RelatorioController::class, 'exportar'])->name('relatorios.exportar');

            // Telas de uma barraquinha vistas pelo admin.
            Route::prefix('barraquinhas/{barraquinha}')->name('loja.')->middleware('loja.coerente')->group(fn () => RotasDaLoja::registrar(admin: true));
        });

        Route::prefix('barraquinha')->name('barraquinha.')->middleware('perfil:barraquinha')
            ->group(fn () => RotasDaLoja::registrar(admin: false));
    });
});
